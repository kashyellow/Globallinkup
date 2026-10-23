import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Inline result banner. The wrapper is a live region so failures are announced. */
export function InlineAlert({
  tone = "error",
  children,
  className,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
}) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-space-sm rounded-2xl border px-space-md py-2.5 font-body-sm text-body-sm",
        isError
          ? "border-danger-border bg-danger-surface text-danger-text"
          : tone === "success"
            ? "border-success-border bg-success-surface text-success-text"
            : "border-outline-variant bg-surface-container text-secondary",
        className,
      )}
    >
      <Icon
        name={isError ? "error_outline" : tone === "success" ? "check_circle" : "info"}
        className="mt-0.5 shrink-0 text-base"
      />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
