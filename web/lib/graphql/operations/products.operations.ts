// Products GraphQL operations for Shopify Admin API
// Queries are plain strings; use with executeGraphQLQuery from @/lib/graphql/client/server-action

// ---------------------------------------------------------------------------
// Query strings
// ---------------------------------------------------------------------------

export const GET_PRODUCTS = /* GraphQL */ `
  query GetProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      edges {
        node {
          id
          title
          handle
          status
          featuredImage {
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                availableForSale
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const GET_PRODUCT_BY_ID = /* GraphQL */ `
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      title
      handle
      status
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price
            availableForSale
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Variable types
// ---------------------------------------------------------------------------

export interface GetProductsVariables {
  first: number;
  after?: string;
  query?: string;
}

export interface GetProductByIdVariables {
  id: string;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ProductVariantNode {
  id: string;
  title: string;
  price: string;
  availableForSale: boolean;
}

export interface ProductNode {
  id: string;
  title: string;
  handle: string;
  status: string;
  featuredImage: {
    url: string;
    altText: string | null;
  } | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    edges: Array<{
      node: ProductVariantNode;
    }>;
  };
}

export interface GetProductsQueryResponse {
  products: {
    edges: Array<{
      node: ProductNode;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}

export interface GetProductByIdQueryResponse {
  product: ProductNode | null;
}
