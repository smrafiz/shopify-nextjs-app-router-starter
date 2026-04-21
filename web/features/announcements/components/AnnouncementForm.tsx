import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAnnouncements } from "../hooks";
import { createAnnouncementSchema, CreateAnnouncementFormValues } from "../validation";

export function AnnouncementForm() {
  const { create, update, selectedAnnouncement, closeForm, isCreating, isUpdating } =
    useAnnouncements();

  const { register, handleSubmit, formState: { errors } } = useForm<CreateAnnouncementFormValues>({
    resolver: zodResolver(createAnnouncementSchema),
    defaultValues: selectedAnnouncement
      ? {
          title: selectedAnnouncement.title,
          message: selectedAnnouncement.message,
          type: selectedAnnouncement.type,
          bgColor: selectedAnnouncement.bgColor,
          textColor: selectedAnnouncement.textColor,
        }
      : {
          type: "INFO",
          bgColor: "#1a1a1a",
          textColor: "#ffffff",
        },
  });

  const onSubmit = async (values: CreateAnnouncementFormValues) => {
    if (selectedAnnouncement) {
      await update(selectedAnnouncement.id, values);
    } else {
      await create(values);
    }
    closeForm();
  };

  const inputStyle = {
    width: "100%",
    padding: "8px",
    border: "1px solid #e1e3e5",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    marginBottom: "4px",
    fontWeight: 500,
    fontSize: "14px",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ padding: "20px" }}>
      <h3 style={{ marginBottom: "20px" }}>
        {selectedAnnouncement ? "Edit Announcement" : "New Announcement"}
      </h3>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Title</label>
        <input {...register("title")} style={inputStyle} placeholder="Summer Sale ends tonight" />
        {errors.title && <p style={{ color: "#dc2626", fontSize: "12px" }}>{errors.title.message}</p>}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Message</label>
        <textarea
          {...register("message")}
          style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          placeholder="Get 20% off all products this weekend only!"
        />
        {errors.message && <p style={{ color: "#dc2626", fontSize: "12px" }}>{errors.message.message}</p>}
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={labelStyle}>Type</label>
        <select {...register("type")} style={inputStyle}>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="PROMO">Promo</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <div>
          <label style={labelStyle}>Background Color</label>
          <input {...register("bgColor")} type="color" style={{ width: "100%", height: "40px", cursor: "pointer" }} />
        </div>
        <div>
          <label style={labelStyle}>Text Color</label>
          <input {...register("textColor")} type="color" style={{ width: "100%", height: "40px", cursor: "pointer" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          type="submit"
          disabled={isCreating || isUpdating}
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
          {isCreating || isUpdating ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={closeForm}
          style={{ padding: "10px 20px", border: "1px solid #e1e3e5", borderRadius: "6px", cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
