import "server-only";

/** Error thrown when Supabase returns a failure. `error.tsx` catches it. */
export class QueryError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "QueryError";
    this.code = code;
  }
}

type QueryResult<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

type CountResult = {
  count: number | null;
  error: { message: string; code?: string } | null;
};

/**
 * Unwraps a Supabase read. `null` is still a valid "no row" result; a real error
 * is thrown so it reaches the route error boundary instead of being rendered as
 * an empty list.
 */
export function unwrap<T>(result: QueryResult<T>): T | null {
  if (result.error) throw new QueryError(result.error.message, result.error.code);
  return result.data;
}

export function unwrapCount(result: CountResult): number {
  if (result.error) throw new QueryError(result.error.message, result.error.code);
  return result.count ?? 0;
}
