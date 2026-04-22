"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProvider } from "@shopify/app-bridge-react";
import { ReactNode, Suspense, useEffect, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
          mutations: { retry: 0 },
        },
      })
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY ?? "";

  return (
    <AppProvider apiKey={apiKey}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={null}>{children}</Suspense>
      </QueryClientProvider>
    </AppProvider>
  );
}
