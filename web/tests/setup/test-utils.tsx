import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Create a new QueryClient for each test
 */
export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

const mockAppConfig = {
    apiKey: process.env.SHOPIFY_API_KEY ?? "test-api-key",
    host: btoa("test-shop.myshopify.com/admin"),
};

const mockShopify = {
    environment: {
        mobile: false,
        pos: false,
        embedded: true,
    },
    idToken: () => Promise.resolve("mock-id-token"),
    sessionToken: () => Promise.resolve("mock-session-token"),
    config: mockAppConfig,
};

interface AllProvidersProps {
    children: React.ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
    const queryClient = createTestQueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

export const mockUseAppBridge = () => mockShopify;

export const waitForLoadingToFinish = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 0));
