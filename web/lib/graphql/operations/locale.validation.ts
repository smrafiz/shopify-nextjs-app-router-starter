import { z } from "zod";

export const CachedLocaleSchema = z
    .object({
        locale: z.string(),
        name: z.string(),
        primary: z.boolean(),
    })
    .strict();

export const CachedLocalesArraySchema = z.array(CachedLocaleSchema);

export type CachedLocale = z.infer<typeof CachedLocaleSchema>;
