import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { Link } from "@/lib/i18n/navigation";
import { IMAGES } from "../data";
import { Eyebrow } from "./styles";

const PEOPLE = [
  { key: "camila", image: IMAGES.camila, status: "activeThisWeek" },
  { key: "mateo", image: IMAGES.mateo, status: "studioOpen" },
  { key: "lucas", image: IMAGES.lucas, status: "hostGuide" },
] as const;

/**
 * Community directory. Three full-height member cards on the sand band; the
 * mockup treats these as dossiers, so the action is a full-width Connect button
 * rather than a bare text link.
 */
export async function PeopleSection() {
  const t = await getTranslations("Landing.people");

  return (
    <section id="people" className="w-full bg-marketing-base py-section-mobile md:py-section">
      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile md:px-margin">
        <Reveal className="flex flex-col gap-space-md md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-space-sm font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
              {t("title")}
            </h2>
            <p className="mt-space-sm max-w-[54ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
              {t("body")}
            </p>
          </div>
          <Link
            href="/discover"
            className="group inline-flex min-h-11 w-fit items-center gap-1.5 font-label-lg text-label-lg text-primary transition-colors duration-300 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("exploreAll")}
            <Icon
              name="arrow_forward"
              className="text-[18px] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
            />
          </Link>
        </Reveal>

        <ul className="mt-space-xl grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
          {PEOPLE.map((person, index) => (
            <Reveal as="li" key={person.key} delay={index * 80} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-marketing-core shadow-lift-sm transition-shadow duration-500 hover:shadow-lift-md">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-marketing-raised md:aspect-[4/3] lg:aspect-[4/5]">
                  <MediaImage
                    src={person.image}
                    alt={t(`${person.key}.alt`)}
                    wrapperClassName="h-full w-full"
                  />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary/85 px-2.5 py-1 font-label-md text-label-md text-white backdrop-blur-sm">
                    <Icon name="location_on" className="text-[14px] text-gold" />
                    {t(`${person.key}.city`)}
                  </span>
                  <span className="absolute right-3 bottom-3 rounded-full bg-gold px-2.5 py-1 font-label-caps text-label-caps tracking-[0.1em] text-on-gold uppercase">
                    {t(`status.${person.status}`)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-space-lg">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <h3 className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
                      {t(`${person.key}.name`)}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full border border-jade-border bg-jade-surface px-2 py-0.5 font-label-md text-label-md text-jade-bright">
                      <Icon name="translate" className="text-[13px]" />
                      {t(`${person.key}.languages`)}
                    </span>
                  </div>

                  <p className="font-body-sm text-body-sm font-medium text-on-surface-variant">
                    {t(`${person.key}.role`)}
                  </p>
                  <p className="line-clamp-3 font-body-sm text-body-sm text-pretty text-on-surface-variant">
                    {t(`${person.key}.quote`)}
                  </p>

                  <ul className="flex flex-wrap gap-1.5 pt-1">
                    {(["tag1", "tag2", "tag3"] as const).map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-outline-variant bg-marketing-raised px-2.5 py-1 font-label-md text-label-md text-on-surface-variant"
                      >
                        {t(`${person.key}.${tag}`)}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/discover"
                    className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Icon name="person_add" className="text-[18px]" />
                    {t("requestConnect")}
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
