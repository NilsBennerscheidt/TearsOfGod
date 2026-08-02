import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingWrapperProps {
  loading: boolean;
  children: ReactNode;
  /** Accessible label for the spinner while loading. */
  label?: string;
  className?: string;
}

/**
 * Swaps between a centered LoadingSpinner and `children` on `loading` —
 * for content that isn't there on first render (client-side fetches,
 * anything loaded after the fact) and needs a placeholder until it is.
 */
export function LoadingWrapper({ loading, children, label = "Loading", className }: LoadingWrapperProps) {
  if (loading) {
    return (
      <div className={cn("flex min-h-24 items-center justify-center", className)}>
        <LoadingSpinner label={label} />
      </div>
    );
  }

  return <>{children}</>;
}
