import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { Eyebrow } from "./styles";

const STEPS = [
  { key: "step1", metaIcon: "badge" },
  { key: "step2", metaIcon: "travel_explore" },
  { key: "step3", metaIcon: "lock" },
  { key: "step4", metaIcon: "handshake" },
] as const;

/**
 * Four-step protocol. Numbered cream cards on a white band — the sequence is
 * carried by the gold counters rather than a connecting rail.
 */
export async function StepsSection() {
  const t = await getTranslations("Landing.steps");

  return (
    <section
      id="how-it-works"
      className="w-full border-y border-outline-variant bg-marketing-core py-section-mobile md:py-section"
    >
      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile md:px-margin">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 className="mt-space-sm font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
            {t("title")}
          </h2>
          <p className="mx-auto mt-space-sm max-w-[58ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
            {t("body")}
          </p>
        </Reveal>

        <ol className="mt-space-xl grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal as="li" key={step.key} delay={index * 70} className="h-full">
              <article className="flex h-full flex-col rounded-2xl bg-marketing-raised p-space-lg">
                <span className="inline-flex w-fit items-center justify-center rounded-lg bg-gold-soft px-2.5 py-1.5 font-label-caps text-label-caps font-bold text-gold-strong tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3 className="mt-space-md font-headline-sm text-headline-sm font-bold text-balance text-on-surface">
                  {t(`${step.key}Title`)}
                </h3>
                <p className="mt-2 font-body-sm text-body-sm text-pretty text-on-surface-variant">
                  {t(`${step.key}Body`)}
                </p>

                <p className="mt-auto flex items-center gap-1.5 border-t border-outline-variant pt-space-md font-label-md text-label-md text-text-muted">
                  <Icon name={step.metaIcon} className="text-[16px] text-gold-strong" />
                  {t(`${step.key}Meta`)}
                </p>
              </article>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
