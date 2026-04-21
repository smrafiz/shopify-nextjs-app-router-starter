import { useAnnouncements } from "../hooks";
import { AnnouncementCard } from "./AnnouncementCard";
import { AnnouncementForm } from "./AnnouncementForm";

export function AnnouncementList() {
  const { announcements, isLoading, error, isFormOpen, openForm } = useAnnouncements();

  if (isLoading) return <p>Loading announcements...</p>;
  if (error) return <p style={{ color: "#dc2626" }}>Error: {error.message}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Announcements</h2>
        <button
          onClick={() => openForm()}
          style={{
            padding: "10px 20px",
            backgroundColor: "#008060",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + New Announcement
        </button>
      </div>

      {isFormOpen && (
        <div
          style={{
            border: "1px solid #e1e3e5",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor: "#fafafa",
          }}
        >
          <AnnouncementForm />
        </div>
      )}

      {announcements.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            border: "2px dashed #e1e3e5",
            borderRadius: "8px",
            color: "#6b7280",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>No announcements yet</p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Create your first announcement to display on your storefront.
          </p>
        </div>
      ) : (
        announcements.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
      )}
    </div>
  );
}
