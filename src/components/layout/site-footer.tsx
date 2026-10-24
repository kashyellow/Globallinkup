import { getTranslations } from "next-intl/server";

import { LegalLinks } from "@/components/layout/legal-links";
import { BrandMark } from "@/components/ui/brand-mark";
import { Link } from "@/lib/i18n/navigation";

type FooterVariant = "marketing" | "public" | "auth" | "app";

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links?: FooterLink[]; texts?: string[] };

function isAnchor(href: string) {
  return href.startsWith("#");
}

function Column({ column }: { column: FooterColumn }) {
  return (
    <div className="min-w-0">
      <h2 className="font-label-caps text-label-caps tracking-[0.14em] text-primary uppercase">
        {column.title}
      </h2>
      <ul className="mt-space-sm space-y-1">
        {column.links?.map((link) => (
          <li key={link.href}>
            {isAnchor(link.href) ? (
              <a
                href={link.href}
                className="inline-flex min-h-11 items-center font-body-sm text-body-sm text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="inline-flex min-h-11 items-center font-body-sm text-body-sm text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
        {column.texts?.map((text) => (
          <li
            key={text}
            className="inline-flex min-h-11 items-center font-body-sm text-body-sm text-on-surface-variant"
          >
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Single footer shell for every surface. The brand block and bottom bar stay
 * identical; only the middle columns vary by route group.
 */
export async function SiteFooter({ variant }: { variant: FooterVariant }) {
  const tMarketing = await getTranslations("MarketingFooter");
  const tPublic = await getTranslations("PublicFooter");
  const tNav = await getTranslations("Nav");

  const columns: FooterColumn[] = [];

  if (variant === "marketing") {
    columns.push(
      {
        title: tMarketing("communityTitle"),
        links: [
          { label: tMarketing("community.discoverPeople"), href: "/discover" },
          { label: tMarketing("community.fieldDispatches"), href: "/posts" },
          { label: tMarketing("community.artisanMarketplace"), href: "/marketplace" },
          { label: tMarketing("community.howPrivacyWorks"), href: "#how-it-works" },
        ],
      },
      {
        title: tMarketing("trustTitle"),
        texts: [
          tMarketing("trust.verifiedIdentity"),
          tMarketing("trust.mutualConsent"),
          tMarketing("trust.artisanProvenance"),
          tMarketing("trust.communityCharter"),
        ],
      },
    );
  }

  if (variant === "public" || variant === "app") {
    columns.push({
      title: variant === "app" ? tMarketing("communityTitle") : tPublic("productTitle"),
      links: [
        { label: tNav("discover"), href: "/discover" },
        { label: tNav("posts"), href: "/posts" },
        { label: tNav("marketplace"), href: "/marketplace" },
        ...(variant === "app" ? [{ label: tNav("connections"), href: "/connections" }] : []),
      ],
    });
  }

  if (variant !== "marketing") {
    columns.push({
      title: tPublic("resourcesTitle"),
      links: [
        { label: tPublic("support"), href: "/support" },
        { label: tPublic("safety"), href: "/safety" },
        { label: tPublic("standards"), href: "/standards" },
      ],
    });
  }

  return (
    <footer className="w-full border-t border-outline-variant bg-marketing-core">
      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-space-xl pb-space-lg md:px-margin">
        <div className="grid grid-cols-1 gap-space-xl md:grid-cols-12">
          <div className="space-y-space-sm md:col-span-5">
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
                <BrandMark className="h-5 w-5" />
              </span>
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
                GlobalLinkup
              </span>
            </span>
            <p className="max-w-md font-body-sm text-body-sm text-pretty text-on-surface-variant">
              {variant === "marketing" ? tMarketing("blurb") : tPublic("tagline")}
            </p>
            {variant === "marketing" ? (
              <p className="max-w-md font-body-sm text-body-sm text-pretty text-text-muted italic">
                {tMarketing("bilingualNote")}
              </p>
            ) : null}
          </div>

          {columns.length > 0 ? (
            <div className="grid grid-cols-1 gap-space-lg sm:grid-cols-2 md:col-span-7">
              {columns.map((column) => (
                <Column key={column.title} column={column} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-space-lg flex flex-col gap-space-sm border-t border-outline-variant pt-space-md sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-text-muted">{tPublic("copyright")}</p>
          <div className="flex flex-col gap-1 sm:items-end">
            <p className="font-label-md text-label-md tracking-[0.08em] text-text-muted">
              {tPublic("motto")}
            </p>
            <LegalLinks />
          </div>
        </div>
      </div>
    </footer>
  );
}
