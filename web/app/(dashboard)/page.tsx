export default function DashboardPage() {
  return (
    <div>
      <h1>Welcome to your Shopify App</h1>
      <p style={{ color: "#6b7280" }}>
        This is the starter template. Start by adding your features in{" "}
        <code>web/features/</code>.
      </p>
      <div
        style={{
          marginTop: "24px",
          padding: "20px",
          border: "1px solid #e1e3e5",
          borderRadius: "8px",
          backgroundColor: "#f9fafb",
        }}
      >
        <h3 style={{ margin: "0 0 8px" }}>Announcement Banner</h3>
        <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: "14px" }}>
          Manage storefront announcements from the Announcements page.
        </p>
        <a href="/announcements" style={{ color: "#008060", fontWeight: 600 }}>
          Manage Announcements →
        </a>
      </div>
    </div>
  );
}
