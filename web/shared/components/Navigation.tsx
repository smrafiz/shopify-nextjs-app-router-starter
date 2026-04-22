"use client";

import Link from "next/link";
import { NavMenu } from "@shopify/app-bridge-react";
import { ROUTES } from "@/shared/constants";

const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", rel: "home" },
  { href: ROUTES.ANNOUNCEMENTS, label: "Announcements" },
];

export function Navigation() {
  return (
    <NavMenu>
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} rel={item.rel}>
          {item.label}
        </Link>
      ))}
    </NavMenu>
  );
}
