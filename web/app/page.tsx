import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/constants";

export default function RootPage() {
  redirect(ROUTES.DASHBOARD);
}
