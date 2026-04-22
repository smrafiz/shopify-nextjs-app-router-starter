export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/",
  ANNOUNCEMENTS: "/announcements",
  SETTINGS: "/settings",
  BILLING: "/billing",
  PROXY_BASE: "/api/proxy",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
