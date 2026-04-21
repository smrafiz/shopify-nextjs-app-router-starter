const STORAGE_KEY = "dismissed_announcements";

interface AnnouncementResponse {
  announcement: {
    id: string;
    title: string;
    message: string;
    type: string;
    bgColor: string;
    textColor: string;
  } | null;
}

function getDismissed(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function dismiss(id: string): void {
  const dismissed = getDismissed();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
  }
}

function isDismissed(id: string): boolean {
  return getDismissed().includes(id);
}

async function loadAnnouncement(banner: HTMLElement): Promise<void> {
  const shop = banner.dataset.shop;
  const blockId = banner.dataset.blockId;
  if (!shop) return;

  try {
    const res = await fetch(
      `/apps/announcements?shop=${encodeURIComponent(shop)}`,
    );
    if (!res.ok) return;
    const { announcement }: AnnouncementResponse = await res.json();
    if (!announcement) return;
    if (isDismissed(announcement.id)) return;

    const msgEl = document.getElementById(`announcement-message-${blockId}`);
    if (msgEl) msgEl.textContent = announcement.message;

    banner.style.backgroundColor = announcement.bgColor || "#1a1a1a";
    banner.style.color = announcement.textColor || "#ffffff";
    banner.dataset.announcementId = announcement.id;
    banner.classList.remove("announcement-banner--hidden");
  } catch {
    // Silently fail — banner stays hidden
  }
}

function attachDismiss(banner: HTMLElement): void {
  const btn = banner.querySelector<HTMLButtonElement>(
    ".announcement-banner__close",
  );
  if (!btn) return;
  btn.addEventListener("click", () => {
    const id = banner.dataset.announcementId;
    if (id) dismiss(id);
    banner.classList.add("announcement-banner--hidden");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll<HTMLElement>(".announcement-banner")
    .forEach((banner) => {
      loadAnnouncement(banner);
      attachDismiss(banner);
    });
});
