const LOCALE_MAP: Record<string, string> = {
    en: "en-US",
    "en-us": "en-US",
    "en-gb": "en-GB",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    it: "it-IT",
    nl: "nl-NL",
    pt: "pt-PT",
    "pt-br": "pt-BR",
    "pt-pt": "pt-PT",
    ru: "ru-RU",
    ja: "ja-JP",
    zh: "zh-CN",
    "zh-cn": "zh-CN",
    "zh-tw": "zh-TW",
    ko: "ko-KR",
    ar: "ar-SA",
    pl: "pl-PL",
    sv: "sv-SE",
    da: "da-DK",
    fi: "fi-FI",
    nb: "nb-NO",
    cs: "cs-CZ",
    sk: "sk-SK",
    hu: "hu-HU",
    ro: "ro-RO",
    bg: "bg-BG",
    hr: "hr-HR",
    sl: "sl-SI",
    et: "et-EE",
    lv: "lv-LV",
    lt: "lt-LT",
    uk: "uk-UA",
    tr: "tr-TR",
    id: "id-ID",
    el: "el-GR",
    he: "he-IL",
    th: "th-TH",
    vi: "vi-VN",
};

function toLang(locale: string): string {
    return LOCALE_MAP[locale.toLowerCase()] ?? locale;
}

async function fetchTranslation(
    text: string,
    sourceLang: string,
    targetLang: string,
): Promise<string> {
    const params = new URLSearchParams({
        q: text,
        langpair: `${sourceLang}|${targetLang}`,
    });
    const res = await fetch(
        `https://api.mymemory.translated.net/get?${params}`,
        { cache: "no-store" },
    );
    if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);

    const json = (await res.json()) as {
        responseStatus: number;
        responseData: { translatedText: string };
    };
    if (json.responseStatus !== 200) {
        throw new Error(`MyMemory error ${json.responseStatus}`);
    }
    return json.responseData.translatedText;
}

async function translateOne(
    text: string,
    sourceLang: string,
    targetLang: string,
): Promise<string> {
    const segments = text.split(/(\{\w+\})/g);
    const results = await Promise.all(
        segments.map((seg) => {
            if (!seg || /^\{\w+\}$/.test(seg)) return Promise.resolve(seg);
            const leading = seg.match(/^\s+/)?.[0] ?? "";
            const trailing = seg.match(/\s+$/)?.[0] ?? "";
            const trimmed = seg.trim();
            if (!trimmed) return Promise.resolve(seg);
            return fetchTranslation(trimmed, sourceLang, targetLang).then(
                (t) => leading + t + trailing,
            );
        }),
    );
    return results.join("");
}

/**
 * Translate a flat labels object from one locale to another using MyMemory API.
 * Preserves {placeholder} parameters during translation.
 */
export async function translateLabels(
    labels: Record<string, string>,
    sourceLocale: string,
    targetLocale: string,
): Promise<Record<string, string>> {
    const sourceLang = toLang(sourceLocale);
    const targetLang = toLang(targetLocale);

    const entries = Object.entries(labels).filter(
        ([, v]) => v && v.trim(),
    ) as [string, string][];

    if (entries.length === 0) return {};

    const translated = await Promise.all(
        entries.map(
            async ([key, value]) =>
                [key, await translateOne(value, sourceLang, targetLang)] as const,
        ),
    );

    return Object.fromEntries(translated);
}
