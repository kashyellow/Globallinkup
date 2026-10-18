import { z } from "zod";

/**
 * A permissive UUID check for opaque row ids.
 *
 * Zod v4's `z.uuid()` enforces RFC-9562 version/variant bits, which rejects the
 * deterministic ids used by `supabase/seed.sql` (e.g. `22222222-2222-…`). Those
 * are valid Postgres `uuid` values, so we only check the shape here.
 */
export const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "invalidId");
