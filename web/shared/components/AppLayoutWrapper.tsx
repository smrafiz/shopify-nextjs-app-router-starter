"use client";

import { ReactNode, Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Navigation } from "./Navigation";

/**
 * App Layout Wrapper
 *
 * Wraps app content and prevents hydration errors for Shopify web components.
 */
export function AppLayoutWrapper({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      <Suspense fallback={null}>
        <Navigation />
      </Suspense>
      {children}
    </>
  );
}
