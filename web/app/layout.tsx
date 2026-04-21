import { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/shared/components";

export const metadata: Metadata = {
  title: "My Shopify App",
  other: {
    "shopify-app-origins": process.env.NEXT_PUBLIC_HOST || "",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="shopify-api-key"
          content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || ""}
        />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
