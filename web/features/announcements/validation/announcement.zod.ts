import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  message: z.string().min(1, "Message is required").max(500),
  type: z.enum(["INFO", "WARNING", "PROMO", "URGENT"]),
  bgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .default("#1a1a1a"),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color")
    .default("#ffffff"),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateAnnouncementFormValues = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementFormValues = z.infer<typeof updateAnnouncementSchema>;
