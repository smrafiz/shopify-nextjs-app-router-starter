"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/shared/constants";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Announcements", href: ROUTES.ANNOUNCEMENTS },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <nav
        style={{
          width: "220px",
          borderRight: "1px solid #e1e3e5",
          padding: "20px 0",
          backgroundColor: "#fafafa",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 20px 20px", fontWeight: 700, fontSize: "16px" }}>
          My Shopify App
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "block",
              padding: "10px 20px",
              color: pathname === item.href ? "#008060" : "#374151",
              fontWeight: pathname === item.href ? 600 : 400,
              textDecoration: "none",
              backgroundColor: pathname === item.href ? "#f0faf5" : "transparent",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main style={{ flex: 1, padding: "32px" }}>{children}</main>
    </div>
  );
}
