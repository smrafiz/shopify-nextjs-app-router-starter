"use client";

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#f6f6f7] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#8c9196" />
                </svg>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-800 text-base">{title}</span>
                {description && (
                    <span className="text-sm text-gray-500 max-w-sm">{description}</span>
                )}
            </div>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 text-sm bg-[#008060] text-white rounded hover:bg-[#006e52] transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
