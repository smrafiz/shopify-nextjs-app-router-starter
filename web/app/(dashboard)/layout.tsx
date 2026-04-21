import { ReactNode } from "react";
import { AppLayout } from "@/shared/components";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
