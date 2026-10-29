import type { Json } from "@/types/database";

export type AuditSnapshot = Record<string, Json>;

export type ProductSnapshotRow = {
  catalog_status: string | null;
  is_published: boolean;
  published_at: string | null;
  deleted_at: string | null;
  price_cents: number;
  currency: string;
};

/** State-only snapshot: no product name, description or image paths. */
export function productSnapshot(row: ProductSnapshotRow, imageCount: number): AuditSnapshot {
  return {
    status: row.catalog_status ?? null,
    is_published: row.is_published,
    published_at: row.published_at,
    deleted_at: row.deleted_at,
    price_cents: row.price_cents,
    currency: row.currency,
    image_count: imageCount,
  };
}

export type ReportSnapshotRow = {
  status: string;
  resolved_at: string | null;
  target_type: string;
  target_user_id: string | null;
  target_post_id: string | null;
};

export function reportSnapshot(row: ReportSnapshotRow): AuditSnapshot {
  return {
    status: row.status,
    resolved_at: row.resolved_at,
    reported_type: row.target_type,
    reported_id: row.target_type === "user" ? row.target_user_id : row.target_post_id,
  };
}

export function commentSnapshot(row: {
  post_id: string;
  deleted_at: string | null;
}): AuditSnapshot {
  return {
    post_id: row.post_id,
    deleted_at: row.deleted_at,
  };
}

export function roleSnapshot(row: { slug: string; capabilities: string[] }): AuditSnapshot {
  return {
    slug: row.slug,
    capabilities: [...row.capabilities].sort(),
  };
}
