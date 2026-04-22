"use client";

import { print } from "graphql";
import { useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { executeGraphQLMutation, executeGraphQLQuery } from "@/lib";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface UseGraphQLOptions {
    enabled?: boolean;
    staleTime?: number;
    refetchOnMount?: boolean | "always";
    refetchOnWindowFocus?: boolean;
}

export interface UseGraphQLReturn<TResult> {
    data: TResult | undefined;
    loading: boolean;
    error: Error | null;
    isLoading: boolean;
    refetch: () => void;
}

function documentQueryKey<TResult, TVariables>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables | object,
): unknown[] {
    const name =
        (document.definitions[0] as any)?.name?.value ?? "unknown";
    return variables ? [name, variables] : [name];
}

/**
 * Generic GraphQL query hook using Server Actions
 */
export function useGraphQL<TResult = any, TVariables extends object = any>(
    document: TypedDocumentNode<TResult, TVariables>,
    variables?: TVariables,
    options?: UseGraphQLOptions,
): UseGraphQLReturn<TResult> {
    const app = useAppBridge();
    const key = documentQueryKey(document, variables);

    const query = useQuery<TResult, Error>({
        queryKey: key,
        enabled: options?.enabled !== false,
        queryFn: async () => {
            if (!app) throw new Error("App Bridge instance not found");

            const sessionToken = await app.idToken();
            const gqlString = print(document);

            if (!gqlString) throw new Error("GraphQL document string is empty");

            const result = await executeGraphQLQuery<TResult>({
                query: gqlString,
                variables: (variables ?? {}) as Record<string, unknown>,
                sessionToken,
            });

            if (result.errors && result.errors.length > 0) {
                throw new Error(
                    `GraphQL Error: ${result.errors.map((e) => e.message).join(", ")}`,
                );
            }

            if (!result.data) throw new Error("No data returned from GraphQL query");

            return result.data;
        },
        staleTime: options?.staleTime ?? 1000 * 60 * 5,
        refetchOnMount: options?.refetchOnMount ?? "always",
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    });

    const refetch = useCallback(() => void query.refetch(), [query]);

    return {
        data: query.data,
        loading: query.isLoading,
        error: query.error,
        isLoading: query.isLoading,
        refetch,
    };
}

/**
 * Generic GraphQL mutation hook using Server Actions
 */
export function useGraphQLMutation<
    TResult = any,
    TVariables extends object = any,
>(
    document: TypedDocumentNode<TResult, TVariables>,
    options?: {
        invalidate?: Array<{
            document: TypedDocumentNode<any, any>;
            variables?: object;
        }>;
        onSuccess?: (data: TResult) => void;
        onError?: (error: Error) => void;
    },
) {
    const app = useAppBridge();
    const queryClient = useQueryClient();

    return useMutation<TResult, Error, TVariables>({
        mutationFn: async (variables: TVariables) => {
            if (!app) throw new Error("App Bridge instance not found");

            const sessionToken = await app.idToken();
            const gqlString = print(document);

            if (!gqlString) throw new Error("GraphQL document string is empty");

            const result = await executeGraphQLMutation<TResult>({
                query: gqlString,
                variables: (variables ?? {}) as Record<string, unknown>,
                sessionToken,
            });

            if (result.errors && result.errors.length > 0) {
                throw new Error(
                    `GraphQL Mutation Error: ${result.errors.map((e) => e.message).join(", ")}`,
                );
            }

            if (!result.data) throw new Error("No data returned from GraphQL mutation");

            return result.data;
        },
        onSuccess: (data) => {
            if (options?.invalidate) {
                for (const { document: doc, variables } of options.invalidate) {
                    const key = documentQueryKey(doc, variables);
                    void queryClient.invalidateQueries({ queryKey: key });
                }
            }
            options?.onSuccess?.(data);
        },
        onError: options?.onError,
    });
}
