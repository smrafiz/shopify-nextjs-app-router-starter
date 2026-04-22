import { print } from "graphql";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { GraphQLResponse } from "@/shared/types";
import { SHOPIFY_API_VERSION } from "@/shared/constants";

const MYSHOPIFY_RE = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

function validateShopDomain(shop: string): void {
  if (!MYSHOPIFY_RE.test(shop)) {
    throw new Error(`Invalid shop domain: ${shop}`);
  }
}

/**
 * GraphQL client for App Proxy routes (storefront → server).
 * Caller is responsible for HMAC verification before invoking this function.
 * Accepts an explicit accessToken rather than deriving it from a session.
 */
export async function executeProxyGraphQL<
  TResult = unknown,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>(
  document: TypedDocumentNode<TResult, TVariables> | string,
  variables: TVariables,
  accessToken: string,
  shopDomain: string,
): Promise<GraphQLResponse<TResult>> {
  try {
    validateShopDomain(shopDomain);

    if (!accessToken) {
      return {
        errors: [{ message: "No access token provided", extensions: { code: "MISSING_ACCESS_TOKEN" } }],
      };
    }

    const query =
      typeof document === "string"
        ? document
        : (document as TypedDocumentNode<TResult, TVariables>)?.loc?.source?.body ??
          print(document);

    if (!query) {
      return {
        errors: [{ message: "GraphQL document string is empty", extensions: { code: "EMPTY_DOCUMENT" } }],
      };
    }

    const endpoint = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables: variables ?? {} }),
    });

    if (!response.ok) {
      return {
        errors: [{
          message: `Shopify API responded with HTTP ${response.status}`,
          extensions: { code: "HTTP_ERROR", statusCode: response.status },
        }],
      };
    }

    const json = (await response.json()) as { data?: TResult; errors?: Array<{ message: string }> };

    if (json.errors?.length) {
      return {
        errors: json.errors.map((e) => ({ message: e.message, extensions: { code: "GRAPHQL_ERROR" } })),
      };
    }

    return { data: json.data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown proxy GraphQL error";
    return { errors: [{ message: msg, extensions: { code: "INTERNAL_ERROR" } }] };
  }
}

/**
 * Convenience wrapper — returns data directly or null on error.
 */
export async function queryProxyGraphQL<
  TResult = unknown,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>(
  document: TypedDocumentNode<TResult, TVariables> | string,
  variables: TVariables,
  accessToken: string,
  shopDomain: string,
): Promise<TResult | null> {
  const result = await executeProxyGraphQL<TResult, TVariables>(document, variables, accessToken, shopDomain);

  if (result.errors?.length) {
    console.error(`Proxy GraphQL error for shop ${shopDomain}:`, result.errors);
    return null;
  }

  return result.data ?? null;
}
