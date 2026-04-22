import {
    useGlobalBannerStore,
    type BannerType,
    type BannerInput,
} from "@/shared/stores/global-banner.store";

interface BannerOptions extends Partial<Omit<BannerInput, "type" | "message">> {
    content?: string;
}

export function useGlobalBanner() {
    const { addBanner, removeBanner, removeBannerByKey, clearAllBanners } =
        useGlobalBannerStore();

    const showMessage = (
        type: BannerType,
        title: string,
        options?: BannerOptions,
    ) => {
        return addBanner({
            type,
            title,
            message: options?.content ?? title,
            key: options?.key,
            dismissible: options?.dismissible,
            autoHide: options?.autoHide,
            duration: options?.duration,
        });
    };

    return {
        showSuccess: (title: string, options?: BannerOptions) =>
            showMessage("success", title, options),

        showError: (title: string, options?: BannerOptions) =>
            showMessage("error", title, options),

        showWarning: (title: string, options?: BannerOptions) =>
            showMessage("warning", title, options),

        showInfo: (title: string, options?: BannerOptions) =>
            showMessage("info", title, options),

        showMessage,

        removeBanner,
        removeBannerByKey,
        clearAllBanners,
    };
}
