"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState, type RefObject } from "react";

import { Icon } from "@/components/ui/icon";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { cn } from "@/lib/utils";
import type { AdminAuditEvent } from "../queries";

/**
 * Audit rows open one shared detail dialog. The JSON block is the point: it
 * shows the event envelope plus `metadata`, which is where state transitions
 * (`from_state` → `to_state`) are recorded. Metadata stays ids/state only by
 * design — no member content ever reaches this table (ADR 0003).
 */
export function AuditList({ events }: { events: AdminAuditEvent[] }) {
  const t = useTranslations("Admin.audit");
  const format = useFormatter();
  const [selected, setSelected] = useState<AdminAuditEvent | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDialogA11y(selected !== null, () => setSelected(null), closeRef);

  const timestamp = (value: string) =>
    format.dateTime(new Date(value), { dateStyle: "medium", timeStyle: "short" });

  return (
    <>
      <ul className="mt-space-md divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant bg-surface-low">
        {events.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              onClick={() => setSelected(event)}
              aria-haspopup="dialog"
              className="group flex min-h-11 w-full items-start justify-between gap-space-sm p-space-md text-left transition-colors duration-300 hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                    {event.action}
                  </span>
                  <span className="font-label-md text-label-md text-text-muted">
                    {timestamp(event.occurredAt)}
                  </span>
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  {event.actorRole ?? "admin"}
                  {event.targetType ? ` · ${event.targetType}` : ""}
                  {event.targetId ? ` ${event.targetId.slice(0, 8)}` : ""}
                </span>
                {event.reason ? (
                  <span className="font-body-sm text-body-sm text-on-surface-strong">
                    {event.reason}
                  </span>
                ) : null}
                <span className="sr-only">{t("viewDetails")}</span>
              </span>
              <Icon
                name="chevron_right"
                className="mt-1 shrink-0 text-lg text-text-muted transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </button>
          </li>
        ))}
      </ul>

      <div
        aria-hidden={selected === null}
        inert={selected === null}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
        className={cn(
          "fixed inset-0 z-[90] flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-space-lg",
          selected ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-detail-title"
          tabIndex={-1}
          className={cn(
            "flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] outline-none sm:max-h-[85dvh] sm:rounded-[1.5rem]",
            selected ? "translate-y-0" : "translate-y-full sm:translate-y-4",
          )}
        >
          {selected ? (
            <AuditDetail
              key={selected.id}
              event={selected}
              timestamp={timestamp(selected.occurredAt)}
              onClose={() => setSelected(null)}
              closeRef={closeRef}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

function AuditDetail({
  event,
  timestamp,
  onClose,
  closeRef,
}: {
  event: AdminAuditEvent;
  timestamp: string;
  onClose: () => void;
  closeRef: RefObject<HTMLButtonElement | null>;
}) {
  const t = useTranslations("Admin.audit");
  const tCommon = useTranslations("Common");

  const beforeSnap = snapshot(event.metadata.before ?? event.metadata.from_state);
  const afterSnap = snapshot(event.metadata.after ?? event.metadata.to_state);
  const keys = [
    ...new Set([...Object.keys(beforeSnap ?? {}), ...Object.keys(afterSnap ?? {})]),
  ].sort();
  const hasSnapshot = Boolean(beforeSnap || afterSnap);
  const before = hasSnapshot ? align(beforeSnap, keys) : null;
  const after = hasSnapshot ? align(afterSnap, keys) : null;
  const changed = new Set(
    keys.filter(
      (key) =>
        JSON.stringify(beforeSnap?.[key] ?? null) !== JSON.stringify(afterSnap?.[key] ?? null),
    ),
  );
  const payload = {
    id: event.id,
    occurredAt: event.occurredAt,
    actorRole: event.actorRole,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    reason: event.reason,
    metadata: event.metadata,
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-space-sm border-b border-outline-variant bg-surface-low/95 px-space-lg py-space-md backdrop-blur-md">
        <div className="min-w-0">
          <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
            {t("detailTitle")}
          </p>
          <h2
            id="audit-detail-title"
            className="mt-0.5 font-headline-sm text-headline-sm font-semibold break-words text-on-surface"
          >
            {event.action}
          </h2>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={tCommon("close")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors duration-300 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Icon name="close" className="text-xl" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-space-lg">
        <dl className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          <Field label={t("fields.occurredAt")} value={timestamp} />
          <Field label={t("fields.actor")} value={event.actorRole ?? "—"} />
          <Field label={t("fields.targetType")} value={event.targetType ?? "—"} />
          <Field
            label={t("fields.targetId")}
            value={event.targetId ?? "—"}
            mono={Boolean(event.targetId)}
          />
          <Field label={t("fields.reason")} value={event.reason ?? "—"} wide />
        </dl>

        <div className="mt-space-lg">
          <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
            <SnapshotBox label={t("before")} value={before} changed={changed} />
            <SnapshotBox label={t("after")} value={after} changed={changed} />
          </div>
          {changed.size > 0 ? (
            <p className="mt-space-sm flex items-center gap-1.5 font-label-md text-label-md text-text-muted">
              <span className="inline-block h-3 w-3 rounded-sm border border-admin-border bg-admin-surface" />
              {t("changedHint")}
            </p>
          ) : null}
        </div>

        <div className="mt-space-lg">
          <p className="font-label-md text-label-md font-semibold text-on-surface">
            {t("eventJson")}
          </p>
          <pre className="mt-2 max-h-72 overflow-auto rounded-xl border border-outline-variant bg-surface-dim p-3 font-mono text-xs leading-relaxed text-on-surface-strong">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      </div>

      <div className="flex justify-end border-t border-outline-variant p-space-md">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-dim px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {tCommon("close")}
        </button>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  mono = false,
  wide = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="font-label-md text-label-md text-text-muted">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 font-body-sm text-body-sm break-words text-on-surface-strong",
          mono && "font-mono text-xs break-all",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** New rows store objects; legacy rows stored a bare state string. */
type Snapshot = Record<string, unknown>;

function snapshot(value: unknown): Snapshot | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !Array.isArray(value)) return value as Snapshot;
  return { state: value };
}

/** Keep both cards on the same keys so the diff is easy to scan. */
function align(value: Snapshot | null, keys: string[]): Snapshot {
  return Object.fromEntries(keys.map((key) => [key, value && key in value ? value[key] : null]));
}

function SnapshotBox({
  label,
  value,
  changed,
}: {
  label: string;
  value: Snapshot | null;
  changed: ReadonlySet<string>;
}) {
  const lines = value === null ? [] : JSON.stringify(value, null, 2).split("\n");

  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-outline-variant bg-surface-dim">
      <h3 className="border-b border-outline-variant px-space-md py-2 font-label-md text-label-md font-semibold text-on-surface">
        {label}
      </h3>
      <pre className="max-h-60 overflow-auto p-3 font-mono text-xs leading-relaxed text-on-surface-strong">
        {value === null
          ? "null"
          : lines.map((line, index) => {
              const match = /^\s*"([^"]+)":/.exec(line);
              const highlighted = match ? changed.has(match[1]) : false;
              return (
                <span
                  key={index}
                  className={cn(
                    "block",
                    highlighted && "-mx-1 rounded-sm bg-admin-surface px-1 text-admin-text",
                  )}
                >
                  {line}
                </span>
              );
            })}
      </pre>
    </section>
  );
}
