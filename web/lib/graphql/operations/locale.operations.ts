// Shop locale / info GraphQL operations for Shopify Admin API
// Queries are plain strings; use with executeGraphQLQuery from @/lib/graphql/client/server-action

// ---------------------------------------------------------------------------
// Query strings
// ---------------------------------------------------------------------------

export const GET_SHOP_LOCALE = /* GraphQL */ `
  query GetShopLocale {
    shop {
      name
      email
      currencyCode
      ianaTimezone
      primaryDomain {
        url
      }
      billingAddress {
        countryCodeV2
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface GetShopLocaleQueryResponse {
  shop: {
    name: string;
    email: string;
    currencyCode: string;
    ianaTimezone: string;
    primaryDomain: {
      url: string;
    };
    billingAddress: {
      countryCodeV2: string | null;
    } | null;
  };
}
