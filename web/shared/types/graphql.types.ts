export interface GraphQLRequest {
  query: unknown;
  variables?: Record<string, unknown>;
  sessionToken?: string;
  shop?: string;
  accessToken?: string;
  _retried?: boolean;
  _retryCount?: number;
}

export interface GraphQLError {
  message: string;
  extensions?: { code?: string; timestamp?: string; statusCode?: number };
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}
