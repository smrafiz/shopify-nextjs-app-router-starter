import React, { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
    fallback?: ReactNode;
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("[ErrorBoundary]", error, info);
    }

    reset() {
        this.setState({ hasError: false, error: null });
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="text-4xl">⚠️</div>
                    <div className="font-semibold text-gray-800">Something went wrong</div>
                    <div className="text-sm text-gray-500 max-w-md">
                        Something went wrong. Please try refreshing the page.
                    </div>
                    <button
                        onClick={() => this.reset()}
                        className="px-4 py-2 text-sm bg-[#008060] text-white rounded hover:bg-[#006e52] transition-colors"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
