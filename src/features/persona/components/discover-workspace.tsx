"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { InlineAlert } from "@/components/ui/inline-alert";
import { DISCOVER_PAGE_SIZE } from "@/features/persona/constants";
import { loadDiscoverPersonasAction } from "@/features/persona/discover-actions";
import type { Persona } from "../data";
import { PersonaFeed } from "./persona-feed";
import { SearchRibbon } from "./search-ribbon";

/**
 * Discovery workspace. Search/regions are server-side; this component owns the
 * loaded pages, debounces the query, ignores stale responses, and appends the
 * next page when the user asks for more.
 */
export function DiscoverWorkspace({
  initialPersonas,
  initialTotal,
  privacy,
  trustStrip,
}: {
  initialPersonas: Persona[];
  initialTotal: number;
  privacy: ReactNode;
  trustStrip: ReactNode;
}) {
  const t = useTranslations("Discover");
  const [query, setQuery] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialPersonas.length < initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      requestId.current += 1;
    };
  }, []);

  async function fetchPage(
    nextQuery: string,
    nextCountries: string[],
    offset: number,
  ): Promise<void> {
    const id = requestId.current + 1;
    requestId.current = id;
    setLoading(true);
    setError(null);

    const result = await loadDiscoverPersonasAction({
      query: nextQuery,
      countries: nextCountries,
      offset,
      limit: DISCOVER_PAGE_SIZE,
    }).catch(() => null);

    // A newer search/filter request won; drop this page.
    if (requestId.current !== id) return;

    if (!result || !result.ok) {
      setError(t("loadError"));
      setLoading(false);
      return;
    }

    if (offset === 0) {
      setPersonas(result.personas);
    } else {
      setPersonas((previous) => {
        const seen = new Set(previous.map((persona) => persona.id));
        return [...previous, ...result.personas.filter((persona) => !seen.has(persona.id))];
      });
    }

    setTotal(result.total);
    setHasMore(offset + result.personas.length < result.total);
    setLoading(false);
  }

  function schedule(nextQuery: string, nextCountries: string[], delay = 300) {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Invalidate an in-flight request immediately, not just when the debounced
    // fetch starts, so an older result cannot flash while the user is typing.
    requestId.current += 1;
    setLoading(true);
    setError(null);
    timerRef.current = setTimeout(() => {
      void fetchPage(nextQuery, nextCountries, 0);
    }, delay);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    schedule(value, countries);
  }

  function handleCountriesChange(nextCountries: string[]) {
    setCountries(nextCountries);
    if (timerRef.current) clearTimeout(timerRef.current);
    // Toggling a checkbox is deliberate; do not wait for a full search debounce.
    schedule(query, nextCountries, 120);
  }

  function clearFilters() {
    if (timerRef.current) clearTimeout(timerRef.current);
    requestId.current += 1;
    setQuery("");
    setCountries([]);
    void fetchPage("", [], 0);
  }

  function loadMore() {
    if (loading || !hasMore) return;
    void fetchPage(query, countries, personas.length);
  }

  return (
    <>
      <SearchRibbon
        query={query}
        onQueryChange={handleQueryChange}
        countries={countries}
        onCountriesChange={handleCountriesChange}
        onClear={clearFilters}
        loading={loading}
      />

      <div className="mt-space-md">{trustStrip}</div>

      {error ? (
        <div className="mt-space-md">
          <InlineAlert>{error}</InlineAlert>
        </div>
      ) : null}

      <div className="mt-page-mobile md:mt-page">
        <PersonaFeed
          personas={personas}
          total={total}
          hasMore={hasMore}
          loadingMore={loading}
          onLoadMore={loadMore}
        />
      </div>

      {privacy}
    </>
  );
}
