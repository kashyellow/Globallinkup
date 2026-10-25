export type SearchParams = Record<string, string | string[] | undefined>;

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePage(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(firstParam(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function parseQuery(value: string | string[] | undefined): string {
  return (firstParam(value) ?? "").trim().slice(0, 100);
}

export function parseEnum<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const candidate = firstParam(value);
  return candidate && (allowed as readonly string[]).includes(candidate)
    ? (candidate as T)
    : fallback;
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
