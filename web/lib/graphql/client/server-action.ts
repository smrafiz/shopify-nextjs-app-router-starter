"use server";

import { print } from "graphql";
import { GraphQLClient } from "graphql-request";
import { handleSessionToken } from "@/lib/shopify";
import { GraphQLRequest, GraphQLResponse } from "@/shared/types";
import { SHOPIFY_API_VERSION } from "@/shared/constants";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";

const RETRYABLE_CODES = [429, 502, 503, 504];
const MAX_RETRIES = 3;
const BACKOFF_MS = [0, 1000, 3000];

function retryableStatus(error: unknown): number | null {
  if (error && typeof error === "object" && "response" in error) {
    const s = (error as any).response?.status;
    if (RETRYABLE_CODES.includes(s)) return s;
  }
  return null;
}

export async function executeGraphQLQuery<T = any>(
  request: GraphQLRequest
): Promise<GraphQLResponse<T>> {
  try {
    const { query, variables = {} } = request;
    if (!query) {
      return { errors: [{ message: "GraphQL query is required", extensions: { code: "MISSING_QUERY" } }] };
    }

    let shop: string;
    let accessToken: string;

    if (request.shop && request.accessToken) {
      shop = request.shop;
      accessToken = request.accessToken;
    } else if (request.sessionToken) {
      const result = await handleSessionToken(request.sessionToken, false, false);
      if (!result.session?.accessToken) {
        return { errors: [{ message: "No access token in session", extensions: { code: "MISSING_ACCESS_TOKEN" } }] };
      }
      shop = result.shop;
      accessToken = result.session.accessToken;
    } else {
      return { errors: [{ message: "Authentication required", extensions: { code: "MISSING_AUTH" } }] };
    }

    const endpoint = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
    const client = new GraphQLClient(endpoint, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    const queryString =
      typeof query === "string"
        ? query
        : (query as TypedDocumentNode)?.loc?.source?.body ?? print(query as any);

    const result = await client.request<T>(queryString, variables);
    return { data: result };
  } catch (error) {
    if (request.sessionToken && !request._retried) {
      const status = (error as any)?.response?.status;
      if (status === 401) {
        try {
          const refreshed = await handleSessionToken(request.sessionToken, false, true, true);
          if (refreshed.session?.accessToken) {
            return executeGraphQLQuery<T>({
              ...request,
              shop: refreshed.shop,
              accessToken: refreshed.session.accessToken,
              _retried: true,
            });
          }
        } catch {
          // Fall through
        }
      }
    }

    const retryable = retryableStatus(error);
    const retryCount = request._retryCount ?? 0;

    if (retryable && retryCount < MAX_RETRIES) {
      const delay = BACKOFF_MS[retryCount] ?? 3000;
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      return executeGraphQLQuery<T>({ ...request, _retryCount: retryCount + 1 });
    }

    if (retryable && retryCount >= MAX_RETRIES) {
      return {
        errors: [{
          message: `Shopify API unavailable (HTTP ${retryable}). Please try again later.`,
          extensions: { code: "SHOPIFY_UNAVAILABLE", statusCode: retryable },
        }],
      };
    }

    const msg = error instanceof Error ? error.message : "Unknown GraphQL error";
    return { errors: [{ message: msg, extensions: { code: "INTERNAL_ERROR" } }] };
  }
}

export async function executeGraphQLMutation<T = any>(
  request: GraphQLRequest
): Promise<GraphQLResponse<T>> {
  return executeGraphQLQuery<T>(request);
}
