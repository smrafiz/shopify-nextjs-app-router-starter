import { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/shared/components";
import { AppLayoutWrapper } from "@/shared/components";

export const metadata: Metadata = {
  title: "My Shopify App",
  other: {
    "shopify-app-origins": process.env.NEXT_PUBLIC_HOST || "",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta
          name="shopify-api-key"
          content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || ""}
        />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        <script src="https://cdn.shopify.com/shopifycloud/polaris.js"></script>
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AppLayoutWrapper>
            <main>{children}</main>
          </AppLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
