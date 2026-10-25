"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, type FormEvent } from "react";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "@/lib/i18n/navigation";

export function AdminSearchForm({
  basePath,
  query,
  status,
  placeholder,
  extra,
}: {
  basePath: string;
  query: string;
  status: string;
  placeholder: string;
  extra?: Record<string, string>;
}) {
  const t = useTranslations("Admin.common");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [draft, setDraft] = useState(query);
  const [pending, startTransition] = useTransition();

  function navigate(nextQuery: string) {
    const params = new URLSearchParams(extra);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (status && status !== "all") params.set("status", status);
    startTransition(() => {
      router.push(params.size > 0 ? `${basePath}?${params.toString()}` : basePath);
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    navigate(draft);
  }

  return (
    <form
      onSubmit={submit}
      aria-busy={pending || undefined}
      className="flex min-w-0 flex-1 flex-col gap-space-xs sm:flex-row"
    >
      <div className="relative min-w-0 flex-1">
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-secondary"
        />
        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 w-full rounded-full border border-outline-variant bg-surface-dim pr-4 pl-11 font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-placeholder hover:border-outline-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </div>
      <div className="flex items-center gap-space-xs">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending || undefined}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-4 font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? (
            <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
          ) : (
            <Icon name="search" className="text-base" />
          )}
          {t("search")}
        </button>
        {query ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setDraft("");
              navigate("");
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container px-4 font-label-md text-label-md text-secondary transition-colors hover:border-outline-hover hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60"
          >
            {t("clear")}
          </button>
        ) : null}
      </div>
    </form>
  );
}
