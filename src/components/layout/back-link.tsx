"use client";

import { Icon } from "@/components/ui/icon";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Return to the previous in-app route. A direct visit has no useful history
 * entry (the browser tab's initial about:blank counts as one), so fall back to
 * the public landing page instead of leaving the site.
 */
export function BackLink({
  label,
  fallbackHref = "/",
  className,
}: {
  label: string;
  fallbackHref?: string;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 font-label-md text-label-md font-semibold text-secondary transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <Icon name="arrow_back" className="text-lg" />
      {label}
    </button>
  );
}
