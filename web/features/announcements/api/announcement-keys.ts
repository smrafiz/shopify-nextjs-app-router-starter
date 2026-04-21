export const announcementKeys = {
  all: ["announcements"] as const,
  lists: () => [...announcementKeys.all, "list"] as const,
  detail: (id: string) => [...announcementKeys.all, "detail", id] as const,
};
