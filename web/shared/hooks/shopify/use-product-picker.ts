"use client";

import { useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";

export interface PickedProductVariant {
    id: string;
    title: string;
    price: string;
}

export interface PickedProduct {
    id: string;
    title: string;
    handle: string;
    images: { url: string }[];
    variants: PickedProductVariant[];
}

export interface UseProductPickerOptions {
    multiple?: boolean;
    initialSelectionIds?: string[];
    onSelect: (products: PickedProduct[]) => void;
    onCancel?: () => void;
}

export function useProductPicker(options: UseProductPickerOptions) {
    const shopify = useAppBridge();

    const open = useCallback(async () => {
        if (!shopify) return;

        const selectionIds = (options.initialSelectionIds ?? []).map((id) => ({ id }));

        const result = await shopify.resourcePicker({
            type: "product",
            multiple: options.multiple ?? false,
            selectionIds: selectionIds.length > 0 ? selectionIds : undefined,
            filter: {
                hidden: true,
                variants: true,
                draft: false,
                archived: false,
            },
        });

        if (!result) {
            options.onCancel?.();
            return;
        }

        const normalized: PickedProduct[] = result.map((p: any) => ({
            id: p.id as string,
            title: p.title as string,
            handle: p.handle as string,
            images: (p.images ?? []).map((img: any) => ({ url: img.originalSrc ?? img.url ?? "" })),
            variants: (p.variants ?? []).map((v: any) => ({
                id: v.id as string,
                title: v.title as string,
                price: v.price as string,
            })),
        }));

        options.onSelect(normalized);
    }, [shopify, options]);

    return { open };
}
