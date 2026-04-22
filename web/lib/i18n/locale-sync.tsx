"use client";

import { useEffect } from "react";

/**
 * Client component that synchronizes the document's lang and dir attributes
 * with the server-detected locale and direction.
 */
export function LocaleSync({
    locale,
    dir,
}: {
    locale: string;
    dir: "ltr" | "rtl";
}) {
    useEffect(() => {
        const html = document.documentElement;
        if (html.getAttribute("lang") !== locale) {
            html.setAttribute("lang", locale);
        }
        if (html.getAttribute("dir") !== dir) {
            html.setAttribute("dir", dir);
        }
    }, [locale, dir]);

    return null;
}
