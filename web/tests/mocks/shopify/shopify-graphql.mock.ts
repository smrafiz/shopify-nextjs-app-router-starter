import { GraphQLError } from "graphql";

/**
 * Mock Shopify products response
 */
export const mockShopifyProducts = {
    products: {
        nodes: [
            {
                id: "gid://shopify/Product/1",
                title: "Test Product 1",
                handle: "test-product-1",
                description: "Test product description",
                featuredImage: {
                    url: "https://cdn.shopify.com/test1.jpg",
                    altText: "Test Product 1",
                },
                variants: {
                    nodes: [
                        {
                            id: "gid://shopify/ProductVariant/1",
                            title: "Default",
                            price: "19.99",
                            compareAtPrice: "29.99",
                            sku: "TEST-SKU-1",
                            inventoryQuantity: 100,
                        },
                    ],
                },
            },
            {
                id: "gid://shopify/Product/2",
                title: "Test Product 2",
                handle: "test-product-2",
                description: "Another test product",
                featuredImage: {
                    url: "https://cdn.shopify.com/test2.jpg",
                    altText: "Test Product 2",
                },
                variants: {
                    nodes: [
                        {
                            id: "gid://shopify/ProductVariant/2",
                            title: "Default",
                            price: "39.99",
                            compareAtPrice: "49.99",
                            sku: "TEST-SKU-2",
                            inventoryQuantity: 50,
                        },
                    ],
                },
            },
        ],
    },
};

/**
 * Shopify GraphQL Mock Client
 */
export class ShopifyGraphQLMock {
    private responses = new Map<string, any>();
    private errors = new Map<string, GraphQLError>();

    /**
     * Mock a successful query response
     */
    mockQuery(operationName: string, response: any) {
        this.responses.set(operationName, response);
        this.errors.delete(operationName);
    }

    /**
     * Mock a query error
     */
    mockError(operationName: string, message: string) {
        this.errors.set(operationName, new GraphQLError(message));
        this.responses.delete(operationName);
    }

    /**
     * Execute a mocked query
     */
    async execute(query: string, variables?: any): Promise<any> {
        const operationName = this.extractOperationName(query);

        const error = this.errors.get(operationName);
        if (error) {
            throw error;
        }

        const response = this.responses.get(operationName);
        if (response) {
            return { data: response };
        }

        throw new Error(
            `No mock found for operation: ${operationName}. Use mockQuery() or mockError().`,
        );
    }

    private extractOperationName(query: string): string {
        const match = query.match(/(?:query|mutation)\s+(\w+)/);
        return match?.[1] ?? "unknown";
    }

    reset() {
        this.responses.clear();
        this.errors.clear();
    }

    isMocked(operationName: string): boolean {
        return (
            this.responses.has(operationName) || this.errors.has(operationName)
        );
    }
}

export const shopifyMock = new ShopifyGraphQLMock();
