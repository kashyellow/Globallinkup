"use client";

import { Reveal } from "@/components/ui/reveal";
import { ProfileActivity } from "./activity-panel";
import { BioCard } from "./bio-card";
import { ContactLocker } from "./contact-locker";
import { DossierHeader } from "./dossier-header";

/**
 * Member dossier, typeset as a field register: index bar, identity plate,
 * ledger, and four ruled sections (bio, vault, archive) reading top to bottom.
 * `dossier-backdrop` supplies the paper grain and corner wash.
 */
export function ProfileView() {
  return (
    <div className="dossier-backdrop flex w-full flex-col text-on-surface">
      <DossierHeader />

      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
        <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-5">
            <Reveal delay={220}>
              <BioCard />
            </Reveal>
            <Reveal delay={300}>
              <ContactLocker />
            </Reveal>
          </div>
          <Reveal delay={380} className="lg:col-span-7">
            <ProfileActivity />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
