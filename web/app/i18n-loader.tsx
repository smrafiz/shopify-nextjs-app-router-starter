import { cookies } from "next/headers";
import { I18nProvider } from "@/lib/i18n/provider";
import { ReactNode } from "react";
import { getDirection } from "@/lib/i18n/direction";
import { LocaleSync } from "@/lib/i18n/locale-sync";

/**
 * Server component that reads the locale cookie and loads translations.
 * Must be wrapped in <Suspense> because cookies() is a dynamic API.
 */
export async function I18nLoader({ children }: { children: ReactNode }) {
    const cookieStore = await cookies();
    const locale = cookieStore.get("NEXT_LOCALE")?.value || "en";
    const dir = getDirection(locale);

    let messages;
    try {
        messages = (await import(`../messages/${locale}.json`)).default;
    } catch {
        messages = (await import("../messages/en.json")).default;
    }

    return (
        <I18nProvider locale={locale} messages={messages}>
            <LocaleSync locale={locale} dir={dir} />
            {children}
        </I18nProvider>
    );
}
