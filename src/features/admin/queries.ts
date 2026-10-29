import "server-only";

import { createSignedImageUrls, resolveImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapCount } from "@/lib/supabase/unwrap";

/** Admin reads. Every request runs on the RLS client as an admin. */

export type AdminProfileStatus = "pending" | "approved" | "rejected" | "suspended";
export type AdminProfileFilter = AdminProfileStatus | "all";

export type AdminModerationEvent = {
  decision: AdminProfileStatus;
  reason: string | null;
  createdAt: string;
};

export type AdminProfileDto = {
  id: string;
  name: string;
  age: number;
  location: string;
  neighborhood: string;
  bioEn: string;
  bioEs: string;
  headline: string | null;
  avatar: string | null;
  status: AdminProfileStatus;
  languages: string[];
  interests: string[];
  submittedAt: string | null;
  moderation: AdminModerationEvent[];
};

export type AdminProductStatus = "draft" | "live" | "unpublished" | "trashed";
export type AdminProductFilter = AdminProductStatus | "all";

export type AdminProductDto = {
  id: string;
  name: string;
  origin: string;
  price: string;
  priceCents: number;
  currency: string;
  phone: string;
  description: string;
  status: AdminProductStatus;
  isPublished: boolean;
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  image: string | null;
  images: string[];
  imagePaths: string[];
};

export type AdminReportStatus = "open" | "resolved" | "dismissed";
export type AdminReportFilter = AdminReportStatus | "all";
export type AdminReportTarget = "user" | "post" | "all";

export type AdminReportDto = {
  id: string;
  reason: string;
  details: string | null;
  status: AdminReportStatus;
  createdAt: string;
  targetType: "user" | "post";
  targetId: string | null;
  targetLabel: string;
  targetImage: string | null;
  targetState: "visible" | "archived" | "removed" | null;
  reporterName: string;
};

export type AdminInterestStatus = "pending" | "approved" | "rejected";
export type AdminInterestFilter = AdminInterestStatus | "all";

export type AdminInterestDto = {
  id: string;
  label: string;
  status: AdminInterestStatus;
  createdByName: string;
  createdAt: string;
};

export type AdminMetrics = {
  pendingProfiles: number;
  approvedProfiles: number;
  rejectedProfiles: number;
  suspendedProfiles: number;
  reportedPosts: number;
  curatedProducts: number;
  openReports: number;
  pendingInterests: number;
};

const USERS_PAGE_SIZE = 10;
const PRODUCTS_PAGE_SIZE = 10;
const REPORTS_PAGE_SIZE = 10;
const INTERESTS_PAGE_SIZE = 12;

export const ADMIN_PAGE_SIZES = {
  users: USERS_PAGE_SIZE,
  marketplace: PRODUCTS_PAGE_SIZE,
  moderation: REPORTS_PAGE_SIZE,
  interests: INTERESTS_PAGE_SIZE,
} as const;

function safeNeedle(value: string) {
  return value
    .trim()
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ");
}

function parseLanguages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const code = (entry as { code?: unknown }).code;
    return typeof code === "string" && code.length > 0 ? [code] : [];
  });
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createClient();

  const [
    pendingProfiles,
    approvedProfiles,
    rejectedProfiles,
    suspendedProfiles,
    reportedPosts,
    curatedProducts,
    openReports,
    pendingInterests,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .eq("approval_status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .eq("approval_status", "approved"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .eq("approval_status", "rejected"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "user")
      .eq("approval_status", "suspended"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "post")
      .eq("status", "open"),
    supabase
      .from("marketplace_products")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .is("deleted_at", null),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase
      .from("interest_catalog")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    pendingProfiles: unwrapCount(pendingProfiles),
    approvedProfiles: unwrapCount(approvedProfiles),
    rejectedProfiles: unwrapCount(rejectedProfiles),
    suspendedProfiles: unwrapCount(suspendedProfiles),
    reportedPosts: unwrapCount(reportedPosts),
    curatedProducts: unwrapCount(curatedProducts),
    openReports: unwrapCount(openReports),
    pendingInterests: unwrapCount(pendingInterests),
  };
}

export async function getAdminUsers({
  query,
  status,
  page,
  pageSize = USERS_PAGE_SIZE,
}: {
  query: string;
  status: AdminProfileFilter;
  page: number;
  pageSize?: number;
}): Promise<{ users: AdminProfileDto[]; total: number }> {
  const supabase = await createClient();

  let request = supabase
    .from("profiles_public")
    .select(
      "id, display_name, country_code, city, neighborhood, avatar_url, bio_en, bio_es, headline, languages, interests, approval_status, submitted_at, age, role",
      { count: "exact" },
    )
    .eq("role", "user");

  if (status !== "all") request = request.eq("approval_status", status);

  const needle = safeNeedle(query);
  if (needle.length > 0) {
    request = request.or(
      `display_name.ilike.%${needle}%,city.ilike.%${needle}%,headline.ilike.%${needle}%,bio_en.ilike.%${needle}%,bio_es.ilike.%${needle}%`,
    );
  }

  const response = await request
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const rows = unwrap(response) ?? [];
  const total = response.count ?? rows.length;
  if (rows.length === 0) return { users: [], total };

  const ids = rows.map((row) => row.id).filter((id): id is string => Boolean(id));
  // Contact channels are PII and are not readable by admins (ADR 0005).
  const [events, avatars] = await Promise.all([
    supabase
      .from("profile_moderation_events")
      .select("profile_id, decision, reason, created_at")
      .in("profile_id", ids)
      .order("created_at", { ascending: false }),
    createSignedImageUrls(
      supabase,
      "avatars",
      rows.map((row) => row.avatar_url),
    ),
  ]);

  const eventsById = new Map<string, AdminModerationEvent[]>();
  for (const event of unwrap(events) ?? []) {
    const list = eventsById.get(event.profile_id) ?? [];
    list.push({
      decision: event.decision,
      reason: event.reason,
      createdAt: event.created_at,
    });
    eventsById.set(event.profile_id, list);
  }

  return {
    users: rows.map((row) => {
      const id = row.id ?? "";
      return {
        id,
        name: row.display_name ?? "",
        age: row.age ?? 0,
        location: [row.city, row.country_code].filter(Boolean).join(", "),
        neighborhood: row.neighborhood ?? "",
        bioEn: row.bio_en ?? "",
        bioEs: row.bio_es ?? "",
        headline: row.headline,
        avatar: resolveImageUrl(row.avatar_url, avatars),
        status: row.approval_status ?? "pending",
        languages: parseLanguages(row.languages),
        interests: row.interests ?? [],
        submittedAt: row.submitted_at,
        moderation: eventsById.get(id) ?? [],
      } satisfies AdminProfileDto;
    }),
    total,
  };
}

export async function getAdminMarketplace({
  query,
  status,
  page,
  pageSize = PRODUCTS_PAGE_SIZE,
}: {
  query: string;
  status: AdminProductFilter;
  page: number;
  pageSize?: number;
}): Promise<{ products: AdminProductDto[]; total: number }> {
  const supabase = await createClient();

  let request = supabase
    .from("marketplace_products")
    .select(
      "id, name, origin_label, price_cents, currency, description, contact_information, is_published, published_at, deleted_at, catalog_status, created_at",
      { count: "exact" },
    );

  if (status !== "all") request = request.eq("catalog_status", status);

  const needle = safeNeedle(query);
  if (needle.length > 0) {
    request = request.or(
      `name.ilike.%${needle}%,description.ilike.%${needle}%,origin_label.ilike.%${needle}%`,
    );
  }

  const response = await request
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const rows = unwrap(response) ?? [];
  const total = response.count ?? rows.length;
  if (rows.length === 0) return { products: [], total };

  const ids = rows.map((row) => row.id);
  const images = unwrap(
    await supabase
      .from("marketplace_product_images")
      .select("product_id, storage_path, sort")
      .in("product_id", ids)
      .order("sort", { ascending: true }),
  );

  const pathsByProduct = new Map<string, string[]>();
  for (const image of images ?? []) {
    const list = pathsByProduct.get(image.product_id) ?? [];
    list.push(image.storage_path);
    pathsByProduct.set(image.product_id, list);
  }

  const signed = await createSignedImageUrls(
    supabase,
    "product-images",
    (images ?? []).map((image) => image.storage_path),
  );

  return {
    products: rows.map((row) => {
      const paths = pathsByProduct.get(row.id) ?? [];
      const urls = paths.map((path) => resolveImageUrl(path, signed) ?? "");
      return {
        id: row.id,
        name: row.name,
        origin: row.origin_label ?? "",
        price: `${(row.price_cents ?? 0) / 100} ${row.currency}`,
        priceCents: row.price_cents ?? 0,
        currency: row.currency,
        phone: row.contact_information ?? "",
        description: row.description ?? "",
        status: row.catalog_status ?? "draft",
        isPublished: row.is_published,
        publishedAt: row.published_at,
        deletedAt: row.deleted_at,
        createdAt: row.created_at,
        image: urls[0] || null,
        images: urls,
        imagePaths: paths,
      } satisfies AdminProductDto;
    }),
    total,
  };
}

export async function getAdminModeration({
  query,
  status,
  target,
  page,
  pageSize = REPORTS_PAGE_SIZE,
}: {
  query: string;
  status: AdminReportFilter;
  target: AdminReportTarget;
  page: number;
  pageSize?: number;
}): Promise<{ reports: AdminReportDto[]; total: number }> {
  const supabase = await createClient();

  let request = supabase
    .from("reports")
    .select(
      "id, reason, details, status, created_at, target_type, reporter_id, target_user_id, target_post_id",
      { count: "exact" },
    );

  if (status !== "all") request = request.eq("status", status);
  if (target !== "all") request = request.eq("target_type", target);

  const needle = safeNeedle(query);
  if (needle.length > 0) {
    request = request.or(`reason.ilike.%${needle}%,details.ilike.%${needle}%`);
  }

  const response = await request
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const rows = unwrap(response) ?? [];
  const total = response.count ?? rows.length;
  if (rows.length === 0) return { reports: [], total };

  const profileIds = [
    ...new Set(
      rows.flatMap((row) => [
        row.reporter_id,
        row.target_type === "user" ? row.target_user_id : null,
      ]),
    ),
  ].filter((id): id is string => Boolean(id));
  const postIds = rows
    .map((row) => (row.target_type === "post" ? row.target_post_id : null))
    .filter((id): id is string => Boolean(id));

  const [profiles, posts] = await Promise.all([
    profileIds.length > 0
      ? supabase.from("profiles_public").select("id, display_name").in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? supabase.from("posts").select("id, caption, image_path, author_id, state").in("id", postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profileRows = unwrap(profiles) ?? [];
  const postRows = unwrap(posts) ?? [];
  const nameById = new Map(profileRows.map((row) => [row.id, row.display_name ?? ""]));
  const postById = new Map(postRows.map((row) => [row.id, row]));

  const postAuthorIds = [...new Set(postRows.map((row) => row.author_id))];
  const authors =
    postAuthorIds.length > 0
      ? (unwrap(
          await supabase.from("profiles_public").select("id, display_name").in("id", postAuthorIds),
        ) ?? [])
      : [];
  const authorNameById = new Map(authors.map((row) => [row.id, row.display_name ?? ""]));

  const imagePaths = postRows.map((row) => row.image_path);
  const signed = await createSignedImageUrls(supabase, "post-images", imagePaths);

  return {
    reports: rows.map((row) => {
      const post =
        row.target_type === "post" && row.target_post_id
          ? postById.get(row.target_post_id)
          : undefined;
      const profileName =
        row.target_type === "user" ? nameById.get(row.target_user_id ?? "") : undefined;
      return {
        id: row.id,
        reason: row.reason,
        details: row.details,
        status: row.status,
        createdAt: row.created_at ?? "",
        targetType: row.target_type,
        targetId: row.target_type === "user" ? row.target_user_id : row.target_post_id,
        targetLabel: post?.caption
          ? `${authorNameById.get(post.author_id) ?? "Member"}: ${post.caption}`
          : (profileName ?? "Member"),
        targetImage: post ? resolveImageUrl(post.image_path, signed) : null,
        targetState: post?.state ?? null,
        reporterName: nameById.get(row.reporter_id) ?? "",
      } satisfies AdminReportDto;
    }),
    total,
  };
}

export type AdminAppealDto = {
  id: string;
  postId: string;
  authorName: string;
  postCaption: string;
  message: string;
  createdAt: string;
};

/** Open appeals waiting for a moderator decision (ADR 0001). */
export async function getOpenAppeals(): Promise<AdminAppealDto[]> {
  const supabase = await createClient();
  const rows =
    unwrap(
      await supabase
        .from("post_appeals")
        .select("id, post_id, author_id, message, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: true })
        .limit(5),
    ) ?? [];

  if (rows.length === 0) return [];

  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const postIds = [...new Set(rows.map((row) => row.post_id))];
  const [authors, posts] = await Promise.all([
    supabase.from("profiles_public").select("id, display_name").in("id", authorIds),
    supabase.from("posts").select("id, caption").in("id", postIds),
  ]);
  const authorById = new Map(
    (unwrap(authors) ?? []).map((row) => [row.id, row.display_name ?? ""]),
  );
  const postById = new Map((unwrap(posts) ?? []).map((row) => [row.id, row.caption ?? ""]));

  return rows.map((row) => ({
    id: row.id,
    postId: row.post_id,
    authorName: authorById.get(row.author_id) ?? "",
    postCaption: postById.get(row.post_id) ?? "",
    message: row.message,
    createdAt: row.created_at,
  }));
}

export async function getAdminInterests({
  query,
  status,
  page,
  pageSize = INTERESTS_PAGE_SIZE,
}: {
  query: string;
  status: AdminInterestFilter;
  page: number;
  pageSize?: number;
}): Promise<{ interests: AdminInterestDto[]; total: number }> {
  const supabase = await createClient();

  let request = supabase
    .from("interest_catalog")
    .select("id, label, status, created_by, created_at", { count: "exact" });

  if (status !== "all") request = request.eq("status", status);
  const needle = safeNeedle(query);
  if (needle.length > 0) request = request.ilike("label", `%${needle}%`);

  const response = await request
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const rows = unwrap(response) ?? [];
  const total = response.count ?? rows.length;
  if (rows.length === 0) return { interests: [], total };

  const creatorIds = [...new Set(rows.map((row) => row.created_by))].filter((id): id is string =>
    Boolean(id),
  );
  const creators =
    creatorIds.length > 0
      ? (unwrap(
          await supabase.from("profiles_public").select("id, display_name").in("id", creatorIds),
        ) ?? [])
      : [];
  const creatorById = new Map(creators.map((row) => [row.id, row.display_name ?? ""]));

  return {
    interests: rows.map((row) => ({
      id: row.id,
      label: row.label,
      status: row.status,
      createdByName: creatorById.get(row.created_by ?? "") ?? "",
      createdAt: row.created_at,
    })),
    total,
  };
}

export async function getAdminInterestCounts(): Promise<Record<AdminInterestFilter, number>> {
  const supabase = await createClient();
  const [all, pending, approved, rejected] = await Promise.all([
    supabase.from("interest_catalog").select("id", { count: "exact", head: true }),
    supabase
      .from("interest_catalog")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("interest_catalog")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("interest_catalog")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),
  ]);
  return {
    all: unwrapCount(all),
    pending: unwrapCount(pending),
    approved: unwrapCount(approved),
    rejected: unwrapCount(rejected),
  };
}

export type AdminAuditEvent = {
  id: string;
  occurredAt: string;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  reason: string | null;
  /** Content-free state snapshot recorded by `record_audit()` (ADR 0003). */
  metadata: Record<string, unknown>;
};

function asMetadata(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Newest first. RLS denies this read without `audit.read`. */
export async function getAuditEvents({
  query = "",
  actionType = "all",
  page = 1,
  pageSize = 15,
}: {
  query?: string;
  actionType?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ events: AdminAuditEvent[]; total: number }> {
  const supabase = await createClient();
  let request = supabase
    .from("audit_events")
    .select("id, occurred_at, actor_role, action, target_type, target_id, reason, metadata", {
      count: "exact",
    });

  if (actionType !== "all") request = request.like("action", `${actionType}.%`);

  const needle = safeNeedle(query);
  if (needle.length > 0) {
    request = request.or(
      `action.ilike.%${needle}%,actor_role.ilike.%${needle}%,target_id::text.ilike.%${needle}%`,
    );
  }

  const response = await request
    .order("occurred_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const rows = unwrap(response) ?? [];
  return {
    total: response.count ?? rows.length,
    events: rows.map((row) => ({
      id: row.id,
      occurredAt: row.occurred_at,
      actorRole: row.actor_role,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      reason: row.reason,
      metadata: asMetadata(row.metadata),
    })),
  };
}
