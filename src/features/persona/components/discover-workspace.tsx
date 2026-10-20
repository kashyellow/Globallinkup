"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { Persona, RegionFilter } from "../data";
import { PersonaFeed } from "./persona-feed";
import { SearchRibbon } from "./search-ribbon";

const REGION_COUNTRY: Partial<Record<RegionFilter, string>> = {
  spain: "ES",
  mexico: "MX",
  colombia: "CO",
  unitedStates: "US",
};

/**
 * Discovery workspace: owns the search/region state so the ribbon and the feed
 * read the same filtered list. Privacy rail and aside are server-rendered and
 * passed through as nodes.
 */
export function DiscoverWorkspace({
  personas,
  privacy,
  aside,
}: {
  personas: Persona[];
  privacy: ReactNode;
  aside: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionFilter>("all");

  const needle = query.trim().toLowerCase();
  const filtered = personas.filter((persona) => {
    const country = REGION_COUNTRY[region];
    if (country && persona.countryCode !== country) return false;
    if (!needle) return true;
    return (
      persona.name.toLowerCase().includes(needle) ||
      persona.location.toLowerCase().includes(needle) ||
      persona.interests.some((interest) => interest.toLowerCase().includes(needle)) ||
      persona.languages.some((language) => language.code.toLowerCase().includes(needle))
    );
  });

  return (
    <>
      <SearchRibbon
        query={query}
        onQueryChange={setQuery}
        region={region}
        onRegionChange={setRegion}
        onClear={() => {
          setQuery("");
          setRegion("all");
        }}
      />

      {privacy}

      <div className="mt-page-mobile grid grid-cols-1 items-start gap-space-lg md:mt-page lg:grid-cols-12">
        <PersonaFeed key={`${query}|${region}`} personas={filtered} />
        <aside className="space-y-space-lg lg:sticky lg:top-24 lg:col-span-5">{aside}</aside>
      </div>
    </>
  );
}
