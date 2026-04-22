import { connection } from "next/server";
import { cookies } from "next/headers";

type MessageValue = string | Record<string, unknown>;
type Messages = Record<string, Record<string, MessageValue>>;

async function resolve(namespace: string, locale: string) {
    let messages: Messages;
    try {
        messages = (await import(`../../messages/${locale}.json`)).default;
    } catch {
        messages = (await import("../../messages/en.json")).default;
    }

    const namespaceParts = namespace.split(".");
    let section: unknown = messages;
    for (const part of namespaceParts) {
        if (section && typeof section === "object" && part in section) {
            section = (section as Record<string, unknown>)[part];
        } else {
            section = {};
            break;
        }
    }

    const resolvedSection = (section || {}) as Record<string, unknown>;

    return (
        key: string,
        params?: Record<string, string | number>,
        defaultValue?: string,
    ) => {
        const parts = key.split(".");
        let value: unknown = resolvedSection;
        for (const part of parts) {
            if (value && typeof value === "object" && part in value) {
                value = (value as Record<string, unknown>)[part];
            } else {
                return defaultValue ?? key;
            }
        }

        if (typeof value !== "string") return defaultValue ?? key;

        if (params) {
            return value.replace(/\{(\w+)\}/g, (_, k) =>
                String(params[k] ?? `{${k}}`),
            );
        }
        return value;
    };
}

export async function getTranslations(namespace: string) {
    await connection();
    const cookieStore = await cookies();
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";
    return resolve(namespace, locale);
}

export async function getStaticTranslations(namespace: string, locale = "en") {
    return resolve(namespace, locale);
}
