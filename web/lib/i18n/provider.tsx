"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";

type MessageValue = string | Record<string, unknown>;
type Messages = Record<string, Record<string, MessageValue>>;

const I18nContext = createContext<{
    locale: string;
    messages: Messages;
}>({
    locale: "en",
    messages: {},
});

export function I18nProvider({
    locale,
    messages,
    children,
}: {
    locale: string;
    messages: Messages;
    children: ReactNode;
}) {
    return (
        <I18nContext.Provider value={{ locale, messages }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslations(namespace: string) {
    const { messages } = useContext(I18nContext);

    // Support dot-notation namespaces like "Dashboard.Metrics"
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

    return useCallback(
        (
            key: string,
            params?: Record<string, string | number>,
            defaultValue?: string,
        ) => {
            // Support dot-notation keys like "steps.enableAppEmbed.title"
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
        },
        [resolvedSection],
    );
}

export function useLocale() {
    const { locale } = useContext(I18nContext);
    return locale;
}
