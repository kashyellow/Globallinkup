"use client";

import { Command } from "cmdk";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import {
  INTEREST_MAX,
  SEEDED_INTERESTS,
  interestsMatch,
  isValidCustomInterest,
  normalizeCustomInterest,
  normalizeInterest,
} from "@/lib/persona/interests";
import { cn } from "@/lib/utils";

export type InterestCatalogItem = {
  label: string;
  status: "approved" | "pending";
};

type Option = {
  value: string;
  label: string;
  icon: string;
  status?: "approved" | "pending";
};

export function InterestCombobox({
  options,
  selected,
  onChange,
  error,
}: {
  options: InterestCatalogItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const t = useTranslations("PersonaForm");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const seededOptions: Option[] = SEEDED_INTERESTS.map((interest) => ({
    value: interest.key,
    label: t(`interests.${interest.key}`),
    icon: interest.icon,
  }));

  const customOptions: Option[] = options
    .filter(
      (item) =>
        !seededOptions.some(
          (seeded) =>
            normalizeInterest(seeded.label) === normalizeInterest(item.label) ||
            normalizeInterest(seeded.value) === normalizeInterest(item.label),
        ),
    )
    .map((item) => ({
      value: item.label,
      label: item.label,
      icon: "tag",
      status: item.status,
    }));

  const allOptions = [...seededOptions, ...customOptions];
  const needle = normalizeInterest(query);
  const visible = allOptions
    .filter(
      (option) =>
        !selected.some((value) => normalizeInterest(value) === normalizeInterest(option.value)),
    )
    .filter(
      (option) =>
        needle.length === 0 ||
        normalizeInterest(option.label).includes(needle) ||
        normalizeInterest(option.value).includes(needle),
    )
    .slice(0, 50);

  const trimmedQuery = normalizeCustomInterest(query);
  const normalizedQuery = normalizeInterest(trimmedQuery);
  const exactMatch = allOptions.some(
    (option) =>
      normalizeInterest(option.value) === normalizedQuery ||
      normalizeInterest(option.label) === normalizedQuery,
  );
  const alreadySelected = selected.some((value) => {
    if (normalizeInterest(value) === normalizedQuery) return true;
    const option = allOptions.find((entry) => interestsMatch(entry.value, value));
    return Boolean(option && normalizeInterest(option.label) === normalizedQuery);
  });
  const atMax = selected.length >= INTEREST_MAX;
  const canCreate =
    !atMax && !exactMatch && !alreadySelected && isValidCustomInterest(trimmedQuery);
  const showInvalidHint =
    needle.length >= 2 && !exactMatch && !alreadySelected && !atMax && !canCreate;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function addInterest(value: string) {
    if (atMax) return;
    if (selected.some((entry) => interestsMatch(entry, value))) return;

    onChange([...selected, value]);
    setQuery("");
  }

  function removeInterest(value: string) {
    onChange(selected.filter((entry) => !interestsMatch(entry, value)));
  }

  function changeQuery(value: string) {
    setQuery(value);
    setOpen(true);
  }

  return (
    <div id="persona-interests" ref={containerRef} className="relative flex flex-col gap-2">
      <div
        className={cn(
          "rounded-xl border bg-surface-low shadow-sm transition-colors",
          error
            ? "border-danger-border-strong"
            : "border-outline-variant focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30",
        )}
      >
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 p-2 pb-0">
            {selected.map((value) => {
              const option = allOptions.find((entry) => interestsMatch(entry.value, value));
              const label = option?.label ?? value;
              const pending = option?.status === "pending";

              return (
                <span
                  key={value}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-primary/30 bg-admin-surface py-1 pr-1 pl-2.5 font-label-md text-label-md text-on-surface"
                >
                  {pending ? (
                    <Icon name="schedule" className="text-[14px] text-primary" />
                  ) : (
                    <Icon name="check" className="text-[14px] text-primary" />
                  )}
                  <span className="max-w-[14rem] truncate">{label}</span>
                  {pending ? (
                    <span className="rounded-full bg-surface-container px-1.5 py-0.5 font-label-caps text-[10px] font-semibold tracking-wide text-secondary uppercase">
                      {t("interestPendingShort")}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeInterest(value)}
                    aria-label={t("removeInterest", { label })}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container-high hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Icon name="close" className="text-[14px]" />
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}

        <Command shouldFilter={false} label={t("interestsLabel")}>
          <div className="flex items-center gap-2 px-3">
            <Icon name="search" className="shrink-0 text-[18px] text-secondary" />
            <Command.Input
              value={query}
              onValueChange={changeQuery}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder={t("interestSearchPlaceholder")}
              aria-required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "persona-interests-error" : "persona-interests-hint"}
              className="h-11 w-full min-w-0 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-secondary focus:outline-none"
            />
            <span className="shrink-0 font-label-caps text-label-caps text-secondary tabular-nums">
              {selected.length} / {INTEREST_MAX}
            </span>
          </div>

          {open ? (
            <Command.List
              className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-xl border border-outline-variant bg-surface-low p-1 shadow-lift-lg"
              onMouseDown={(event) => event.preventDefault()}
            >
              <Command.Empty className="px-3 py-4 font-body-sm text-body-sm text-secondary">
                {atMax
                  ? t("interestMax", { max: INTEREST_MAX })
                  : showInvalidHint
                    ? t("interestInvalid")
                    : t("interestEmpty")}
              </Command.Empty>

              {visible.map((option) => (
                <Command.Item
                  key={`${option.status ?? "seeded"}:${option.value}`}
                  value={option.value}
                  disabled={atMax}
                  onSelect={() => addInterest(option.value)}
                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 font-body-sm text-body-sm text-on-surface outline-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[selected=true]:bg-surface-container-high"
                >
                  <Icon
                    name={option.icon}
                    className={cn(
                      "text-[16px]",
                      option.status === "pending" ? "text-primary" : "text-secondary",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.status === "pending" ? (
                    <span className="rounded-full border border-outline-variant bg-surface-container px-1.5 py-0.5 font-label-caps text-[10px] font-semibold tracking-wide text-secondary uppercase">
                      {t("interestPendingShort")}
                    </span>
                  ) : null}
                  <Icon name="add" className="text-[16px] text-secondary" />
                </Command.Item>
              ))}

              {canCreate ? (
                <Command.Item
                  value={`create:${trimmedQuery}`}
                  onSelect={() => addInterest(trimmedQuery)}
                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/40 px-2.5 py-2 font-body-sm text-body-sm text-on-surface outline-none data-[selected=true]:bg-surface-container-high"
                >
                  <Icon name="add" className="text-[16px] text-primary" />
                  <span className="min-w-0 flex-1">
                    {t("interestCreate", { label: trimmedQuery })}
                  </span>
                  <span className="font-label-caps text-[10px] tracking-wide text-primary uppercase">
                    {t("interestNew")}
                  </span>
                </Command.Item>
              ) : null}
            </Command.List>
          ) : null}
        </Command>
      </div>

      <p id="persona-interests-hint" className="font-body-sm text-body-sm text-secondary">
        {t("interestSearchHint")}
      </p>

      {error ? (
        <p
          id="persona-interests-error"
          role="alert"
          className="font-body-sm text-body-sm text-danger-text"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
