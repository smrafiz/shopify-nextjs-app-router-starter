import { Metadata } from "next";
import { AnnouncementList } from "@/features/announcements";

export const metadata: Metadata = {
  title: "Announcements",
};

export default function AnnouncementsPage() {
  return <AnnouncementList />;
}
