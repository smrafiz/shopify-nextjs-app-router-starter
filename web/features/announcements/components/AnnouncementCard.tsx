import { useAnnouncements } from "../hooks";
import { Announcement } from "../types";

interface Props {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: Props) {
  const { update, remove, openForm, isDeleting } = useAnnouncements();

  const typeColors: Record<string, string> = {
    INFO: "#0070f3",
    WARNING: "#f5a623",
    PROMO: "#7c3aed",
    URGENT: "#dc2626",
  };

  return (
    <div
      style={{
        border: "1px solid #e1e3e5",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: typeColors[announcement.type] ?? "#6b7280",
              textTransform: "uppercase",
            }}
          >
            {announcement.type}
          </span>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "12px",
              backgroundColor: announcement.isActive ? "#dcfce7" : "#f3f4f6",
              color: announcement.isActive ? "#16a34a" : "#6b7280",
            }}
          >
            {announcement.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{announcement.title}</p>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>{announcement.message}</p>
      </div>

      <div style={{ display: "flex", gap: "8px", marginLeft: "16px" }}>
        <button
          onClick={() =>
            update(announcement.id, { isActive: !announcement.isActive })
          }
          style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e1e3e5" }}
        >
          {announcement.isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          onClick={() => openForm(announcement)}
          style={{ cursor: "pointer", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e1e3e5" }}
        >
          Edit
        </button>
        <button
          onClick={() => remove(announcement.id)}
          disabled={isDeleting}
          style={{
            cursor: "pointer",
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #fca5a5",
            color: "#dc2626",
            backgroundColor: "#fff5f5",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
