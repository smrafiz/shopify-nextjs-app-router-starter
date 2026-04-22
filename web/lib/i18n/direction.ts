export type Direction = "ltr" | "rtl";

const RTL_LOCALES = ["ar", "he", "fa", "ur"];

export function getDirection(locale: string): Direction {
    if (!locale) return "ltr";
    const baseLocale = locale.split("-")[0].toLowerCase();
    return RTL_LOCALES.includes(baseLocale) ? "rtl" : "ltr";
}

export function isRtl(locale: string): boolean {
    return getDirection(locale) === "rtl";
}
