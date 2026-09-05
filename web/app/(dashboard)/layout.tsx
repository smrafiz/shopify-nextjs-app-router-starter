import { ReactNode } from "react";
import { AppLayoutWrapper } from "@/shared/components";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return <AppLayoutWrapper>{children}</AppLayoutWrapper>;
}
