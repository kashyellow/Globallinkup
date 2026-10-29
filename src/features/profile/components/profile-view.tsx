"use client";

import { Reveal } from "@/components/ui/reveal";
import type { OwnProfile } from "../queries";
import { ProfileActivity } from "./activity-panel";
import { BioCard } from "./bio-card";
import { ContactLocker } from "./contact-locker";
import { DossierHeader } from "./dossier-header";

/**
 * Member dossier, typeset as a field register. Identity, bio, the contact
 * locker and the archive all read real rows; the archive only exposes tabs
 * that have a backing table (posts + accepted connections).
 */
export function ProfileView({ profile }: { profile: OwnProfile }) {
  return (
    <div className="dossier-backdrop flex w-full flex-col text-on-surface">
      <DossierHeader
        profile={profile}
        canShare={profile.role !== "admin"}
        canEdit={profile.role !== "admin"}
      />

      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
        <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-5">
            <Reveal delay={220}>
              <BioCard bio={profile.bio} />
            </Reveal>
            <Reveal delay={300}>
              <ContactLocker channels={profile.channels} unveiled={profile.unveiled} />
            </Reveal>
          </div>
          <Reveal delay={380} className="lg:col-span-7">
            <ProfileActivity dispatches={profile.dispatches} circles={profile.unveiled} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
