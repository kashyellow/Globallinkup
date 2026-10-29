import { BackLink } from "@/components/layout/back-link";

/** Shared layout for not-yet-published resource pages (support/safety/standards). */
export function PlaceholderPage({
  title,
  noticeTitle,
  noticeBody,
  backLabel,
}: {
  /** Accepted for existing callers; no longer rendered (no label above the title). */
  eyebrow: string;
  title: string;
  noticeTitle: string;
  noticeBody: string;
  backLabel: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[820px] px-margin-mobile py-space-lg lg:px-margin lg:py-space-xl">
      <BackLink label={backLabel} />

      <header className="mt-space-md flex flex-col gap-space-xs">
        <h1 className="font-title text-title-mobile font-bold text-on-surface md:text-title">
          {title}
        </h1>
      </header>

      <section className="mt-space-lg flex flex-col gap-space-md border-t border-outline-variant pt-space-lg">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          {noticeTitle}
        </h2>
        <p className="font-body-md text-body-md leading-relaxed text-secondary">{noticeBody}</p>
      </section>
    </div>
  );
}
