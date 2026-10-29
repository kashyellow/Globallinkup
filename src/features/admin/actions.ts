"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/audit";
import { productSnapshot, reportSnapshot } from "@/features/admin/audit-snapshots";
import { notifyMember } from "@/lib/notifications";
import { z } from "zod";
import { uuidSchema } from "@/lib/validation/ids";

import type { AdminCapability } from "@/lib/admin-capabilities";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * S3e — admin operations. All run on the RLS client: the admin policies plus the
 * guard's admin bypass cover them, so no service-role key is needed. The admin
 * check is done without redirecting (Server Actions cannot use `getLocale()`).
 */

export type AdminResult = { ok: true } | { ok: false; error: string };

async function requireCapabilityClient(capability: AdminCapability) {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.role !== "admin" || profile.approval_status !== "approved") {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_capabilities");
  if (!Array.isArray(data) || !data.includes(capability)) return null;
  return { user, supabase };
}

// ---------------------------------------------------------------------------
// Persona review (SA-1)
// ---------------------------------------------------------------------------
const reviewSchema = z.object({
  profileId: uuidSchema,
  decision: z.enum(["approved", "rejected", "suspended"]),
  reason: z.string().trim().max(500).optional(),
});

export async function reviewPersonaAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("members.review");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: beforeMember } = await ctx.supabase
    .from("profiles")
    .select("approval_status, reviewed_at")
    .eq("id", parsed.data.profileId)
    .maybeSingle();

  const { data, error } = await ctx.supabase.rpc("review_persona", {
    p_profile_id: parsed.data.profileId,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason ?? undefined,
  });

  if (error || data !== true) return { ok: false, error: "unknown" };

  const decision = parsed.data.decision;
  const { data: afterMember } = await ctx.supabase
    .from("profiles")
    .select("approval_status, reviewed_at")
    .eq("id", parsed.data.profileId)
    .maybeSingle();

  await recordAudit({
    action: `member.${decision === "approved" ? "approved" : decision === "suspended" ? "suspended" : "rejected"}`,
    targetType: "profile",
    targetId: parsed.data.profileId,
    reason: parsed.data.reason ?? null,
    metadata: {
      before: {
        approval_status: beforeMember?.approval_status ?? null,
        reviewed_at: beforeMember?.reviewed_at ?? null,
      },
      after: {
        approval_status: afterMember?.approval_status ?? decision,
        reviewed_at: afterMember?.reviewed_at ?? null,
      },
    },
  });

  await notifyMember({
    recipientId: parsed.data.profileId,
    type:
      decision === "approved"
        ? "persona.approved"
        : decision === "suspended"
          ? "persona.suspended"
          : "persona.rejected",
    targetType: "profile",
    targetId: parsed.data.profileId,
    reason: parsed.data.reason ?? null,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reports & moderation
// ---------------------------------------------------------------------------
const reportSchema = z.object({
  reportId: uuidSchema,
  status: z.enum(["resolved", "dismissed"]),
});

export async function resolveReportAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("reports.manage");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: report } = await ctx.supabase
    .from("reports")
    .select("id, status, resolved_at, target_type, target_user_id, target_post_id")
    .eq("id", parsed.data.reportId)
    .maybeSingle();
  if (!report) return { ok: false, error: "forbidden" };

  const resolvedAt = new Date().toISOString();
  const { data: updated, error } = await ctx.supabase
    .from("reports")
    .update({
      status: parsed.data.status,
      resolved_by: ctx.user.id,
      resolved_at: resolvedAt,
    })
    .eq("id", parsed.data.reportId)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };

  await recordAudit({
    action: `report.${parsed.data.status}`,
    targetType: "report",
    targetId: report.id,
    metadata: {
      before: reportSnapshot(report),
      after: reportSnapshot({
        ...report,
        status: parsed.data.status,
        resolved_at: resolvedAt,
      }),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  return { ok: true };
}

const postSchema = z.object({ postId: uuidSchema });

/** Moderation retention window (ADR 0001). Mirrors the purge job. */
const PURGE_WINDOW_DAYS = 14;

const removePostSchema = postSchema.extend({
  /**
   * Required by the moderation dialog; the fallback keeps older call sites
   * working until the UI passes the reason everywhere.
   */
  reason: z.string().trim().min(10).max(500).optional(),
});

export async function removePostAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("posts.moderate");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = removePostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: current, error: readError } = await ctx.supabase
    .from("posts")
    .select("id, state, moderation_status, previous_state, author_id, removed_at, purge_after")
    .eq("id", parsed.data.postId)
    .maybeSingle();

  if (readError) return { ok: false, error: "unknown" };
  if (!current) return { ok: false, error: "forbidden" };

  const now = new Date();
  const purgeAfter = new Date(now.getTime() + PURGE_WINDOW_DAYS * 86_400_000).toISOString();
  const previousState = current.state === "removed" ? "visible" : current.state;
  const { data: updated, error } = await ctx.supabase
    .from("posts")
    .update({
      state: "removed",
      previous_state: previousState,
      removed_by: ctx.user.id,
      removed_at: now.toISOString(),
      removed_reason: parsed.data.reason ?? "Removed by moderation.",
      purge_after: purgeAfter,
    })
    .eq("id", parsed.data.postId)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };

  await recordAudit({
    action: "post.removed",
    targetType: "post",
    targetId: current.id,
    reason: parsed.data.reason ?? "Removed by moderation.",
    metadata: {
      before: {
        state: current.state,
        moderation_status: current.moderation_status,
        previous_state: current.previous_state,
        removed_at: current.removed_at,
        purge_after: current.purge_after,
      },
      after: {
        state: "removed",
        moderation_status: "removed",
        previous_state: previousState,
        removed_at: now.toISOString(),
        purge_after: purgeAfter,
      },
    },
  });

  await notifyMember({
    recipientId: current.author_id,
    type: "post.removed",
    targetType: "post",
    targetId: current.id,
    reason: parsed.data.reason ?? "Removed by moderation.",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/posts");
  revalidatePath("/profile");
  return { ok: true };
}

/** Undo a removal while the appeal window is open. */
export async function restorePostAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("posts.moderate");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: current, error: readError } = await ctx.supabase
    .from("posts")
    .select("id, state, moderation_status, previous_state, author_id, removed_at, purge_after")
    .eq("id", parsed.data.postId)
    .maybeSingle();

  if (readError) return { ok: false, error: "unknown" };
  if (!current) return { ok: false, error: "forbidden" };
  if (current.state !== "removed") return { ok: true };

  const target = current.previous_state ?? "visible";
  const now = new Date().toISOString();
  const { data: updated, error } = await ctx.supabase
    .from("posts")
    .update({
      state: target,
      archived_at: target === "archived" ? now : null,
      removed_by: null,
      removed_at: null,
      removed_reason: null,
      previous_state: null,
      purge_after: null,
    })
    .eq("id", parsed.data.postId)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };

  await recordAudit({
    action: "post.restored",
    targetType: "post",
    targetId: current.id,
    metadata: {
      before: {
        state: current.state,
        moderation_status: current.moderation_status,
        previous_state: current.previous_state,
        removed_at: current.removed_at,
        purge_after: current.purge_after,
      },
      after: {
        state: target,
        moderation_status: target === "visible" ? "visible" : "removed",
        previous_state: null,
        removed_at: null,
        purge_after: null,
      },
    },
  });

  await notifyMember({
    recipientId: current.author_id,
    type: "post.restored",
    targetType: "post",
    targetId: current.id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/posts");
  revalidatePath("/profile");
  return { ok: true };
}

/**
 * Accept or decline an appeal (ADR 0001). Accepting restores the post; declining
 * keeps the removal and tells the author why. FormData keeps the desk server-
 * rendered: no client state, no extra dialog.
 */
export async function resolveAppealFormAction(formData: FormData): Promise<void> {
  const ctx = await requireCapabilityClient("posts.moderate");
  if (!ctx) return;

  const parsed = z
    .object({
      appealId: uuidSchema,
      decision: z.enum(["accepted", "declined"]),
      note: z.string().trim().max(500).optional(),
    })
    .safeParse({
      appealId: formData.get("appealId"),
      decision: formData.get("decision"),
      note: formData.get("note") ?? undefined,
    });
  if (!parsed.success) return;

  const { data: appeal } = await ctx.supabase
    .from("post_appeals")
    .select("id, post_id, author_id, status")
    .eq("id", parsed.data.appealId)
    .maybeSingle();

  if (!appeal || appeal.status !== "open") return;

  const accepted = parsed.data.decision === "accepted";
  const now = new Date().toISOString();
  const { data: post } = await ctx.supabase
    .from("posts")
    .select("id, state, previous_state")
    .eq("id", appeal.post_id)
    .maybeSingle();
  const restoredState = post?.previous_state ?? "visible";

  await ctx.supabase
    .from("post_appeals")
    .update({
      status: parsed.data.decision,
      admin_id: ctx.user.id,
      admin_note: parsed.data.note?.length ? parsed.data.note : null,
      resolved_at: now,
    })
    .eq("id", appeal.id);

  await recordAudit({
    action: accepted ? "appeal.accepted" : "appeal.declined",
    targetType: "post",
    targetId: appeal.post_id,
    reason: parsed.data.note ?? null,
    metadata: {
      before: { status: appeal.status, post_state: post?.state ?? null },
      after: {
        status: parsed.data.decision,
        post_state: accepted ? restoredState : (post?.state ?? null),
      },
    },
  });

  if (accepted) {
    await ctx.supabase
      .from("posts")
      .update({
        state: restoredState,
        archived_at: restoredState === "archived" ? now : null,
        removed_by: null,
        removed_at: null,
        removed_reason: null,
        previous_state: null,
        purge_after: null,
      })
      .eq("id", appeal.post_id);

    await notifyMember({
      recipientId: appeal.author_id,
      type: "post.restored",
      targetType: "post",
      targetId: appeal.post_id,
    });
  } else {
    await notifyMember({
      recipientId: appeal.author_id,
      type: "appeal.declined",
      targetType: "post",
      targetId: appeal.post_id,
      reason: parsed.data.note ?? null,
    });
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/profile");
  revalidatePath("/posts");
}

// ---------------------------------------------------------------------------
// Cultural-interest review (S6)
// ---------------------------------------------------------------------------
const interestReviewSchema = z.object({
  interestId: uuidSchema,
  decision: z.enum(["approved", "rejected"]),
});

export async function reviewInterestAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("interests.review");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = interestReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: interest } = await ctx.supabase
    .from("interest_catalog")
    .select("id, created_by, status, reviewed_at")
    .eq("id", parsed.data.interestId)
    .maybeSingle();

  const { data, error } = await ctx.supabase.rpc("review_interest", {
    p_interest_id: parsed.data.interestId,
    p_decision: parsed.data.decision,
  });

  if (error || data !== true) return { ok: false, error: "unknown" };

  const { data: afterInterest } = await ctx.supabase
    .from("interest_catalog")
    .select("status, reviewed_at")
    .eq("id", parsed.data.interestId)
    .maybeSingle();

  await recordAudit({
    action: parsed.data.decision === "approved" ? "interest.approved" : "interest.rejected",
    targetType: "interest",
    targetId: parsed.data.interestId,
    metadata: {
      before: {
        status: interest?.status ?? null,
        reviewed_at: interest?.reviewed_at ?? null,
      },
      after: {
        status: afterInterest?.status ?? parsed.data.decision,
        reviewed_at: afterInterest?.reviewed_at ?? null,
      },
    },
  });

  if (interest?.created_by) {
    await notifyMember({
      recipientId: interest.created_by,
      type: parsed.data.decision === "approved" ? "interest.approved" : "interest.rejected",
      targetType: "interest",
      targetId: interest.id,
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/interests");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Marketplace CRUD
// ---------------------------------------------------------------------------

/** State fields only: never the name, description or image paths. */
const PRODUCT_SNAPSHOT_FIELDS =
  "id, catalog_status, is_published, published_at, deleted_at, price_cents, currency";

async function productImageCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
): Promise<number> {
  const { count } = await supabase
    .from("marketplace_product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  return count ?? 0;
}
const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  priceCents: z.number().int().min(0).max(100_000_000),
  currency: z.string().trim().length(3).default("USD"),
  description: z.string().trim().max(2000).optional(),
  originLabel: z.string().trim().max(120).optional(),
  /** Phone for the seller contact line on the public catalog. */
  isPublished: z.boolean().default(false),
  imagePaths: z.array(z.string().trim().min(1).max(400)).max(10).default([]),
});

export async function createProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("marketplace.manage");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  if (data.isPublished && data.imagePaths.length === 0) {
    return { ok: false, error: "invalid" };
  }

  const { data: created, error } = await ctx.supabase
    .from("marketplace_products")
    .insert({
      name: data.name,
      price_cents: data.priceCents,
      currency: data.currency,
      description: data.description ?? null,
      origin_label: data.originLabel ?? null,
      is_published: data.isPublished,
      created_by: ctx.user.id,
    })
    .select(PRODUCT_SNAPSHOT_FIELDS)
    .single();

  if (error || !created) return { ok: false, error: "unknown" };

  if (data.imagePaths.length > 0) {
    await ctx.supabase.from("marketplace_product_images").insert(
      data.imagePaths.map((storagePath, sort) => ({
        product_id: created.id,
        storage_path: storagePath,
        sort,
      })),
    );
  }

  await recordAudit({
    action: "product.created",
    targetType: "product",
    targetId: created.id,
    metadata: {
      before: {
        status: "none",
        is_published: false,
        published_at: null,
        deleted_at: null,
        price_cents: null,
        currency: null,
        image_count: 0,
      },
      after: productSnapshot(created, data.imagePaths.length),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}

const updateSchema = productSchema.extend({ productId: uuidSchema });

export async function updateProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("marketplace.manage");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  if (data.isPublished && data.imagePaths.length === 0) {
    return { ok: false, error: "invalid" };
  }

  const { data: current } = await ctx.supabase
    .from("marketplace_products")
    .select(PRODUCT_SNAPSHOT_FIELDS)
    .eq("id", data.productId)
    .maybeSingle();
  if (!current) return { ok: false, error: "forbidden" };
  const beforeImages = await productImageCount(ctx.supabase, data.productId);

  const { data: updated, error } = await ctx.supabase
    .from("marketplace_products")
    .update({
      name: data.name,
      price_cents: data.priceCents,
      currency: data.currency,
      description: data.description ?? null,
      origin_label: data.originLabel ?? null,
      is_published: data.isPublished,
    })
    .eq("id", data.productId)
    .select(PRODUCT_SNAPSHOT_FIELDS);

  if (error) return { ok: false, error: "unknown" };
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };

  await ctx.supabase.from("marketplace_product_images").delete().eq("product_id", data.productId);
  if (data.imagePaths.length > 0) {
    await ctx.supabase.from("marketplace_product_images").insert(
      data.imagePaths.map((storagePath, sort) => ({
        product_id: data.productId,
        storage_path: storagePath,
        sort,
      })),
    );
  }

  await recordAudit({
    action: "product.updated",
    targetType: "product",
    targetId: data.productId,
    metadata: {
      before: productSnapshot(current, beforeImages),
      after: productSnapshot(updated[0], data.imagePaths.length),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}

const publishSchema = z.object({ productId: uuidSchema, isPublished: z.boolean() });

export async function setProductPublishedAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("marketplace.manage");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: current } = await ctx.supabase
    .from("marketplace_products")
    .select(PRODUCT_SNAPSHOT_FIELDS)
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (!current) return { ok: false, error: "forbidden" };
  const images = await productImageCount(ctx.supabase, parsed.data.productId);

  const { data: updated, error } = await ctx.supabase
    .from("marketplace_products")
    .update({ is_published: parsed.data.isPublished })
    .eq("id", parsed.data.productId)
    .select(PRODUCT_SNAPSHOT_FIELDS);

  if (error) return { ok: false, error: "unknown" };
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };

  await recordAudit({
    action: parsed.data.isPublished ? "product.published" : "product.unpublished",
    targetType: "product",
    targetId: parsed.data.productId,
    metadata: {
      before: productSnapshot(current, images),
      after: productSnapshot(updated[0], images),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}

const productIdSchema = z.object({ productId: uuidSchema });

export async function deleteProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("marketplace.manage");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: current } = await ctx.supabase
    .from("marketplace_products")
    .select(PRODUCT_SNAPSHOT_FIELDS)
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (!current) return { ok: false, error: "forbidden" };
  const images = await productImageCount(ctx.supabase, parsed.data.productId);

  // Soft delete (Phase 0 schema): the row and its images stay recoverable from
  // the admin Trash view. Public queries exclude `deleted_at is not null`.
  const { data: deleted, error } = await ctx.supabase
    .from("marketplace_products")
    .update({ deleted_at: new Date().toISOString(), is_published: false })
    .eq("id", parsed.data.productId)
    .is("deleted_at", null)
    .select(PRODUCT_SNAPSHOT_FIELDS);

  if (error) return { ok: false, error: "unknown" };
  if (!deleted || deleted.length === 0) return { ok: false, error: "forbidden" };

  await recordAudit({
    action: "product.trashed",
    targetType: "product",
    targetId: parsed.data.productId,
    metadata: {
      before: productSnapshot(current, images),
      after: productSnapshot(deleted[0], images),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}

const restoreSchema = z.object({ productId: uuidSchema });

export async function restoreProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireCapabilityClient("marketplace.manage");
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = restoreSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: current } = await ctx.supabase
    .from("marketplace_products")
    .select(PRODUCT_SNAPSHOT_FIELDS)
    .eq("id", parsed.data.productId)
    .maybeSingle();
  if (!current) return { ok: false, error: "forbidden" };
  const images = await productImageCount(ctx.supabase, parsed.data.productId);

  const { data: restored, error } = await ctx.supabase
    .from("marketplace_products")
    .update({ deleted_at: null })
    .eq("id", parsed.data.productId)
    .not("deleted_at", "is", null)
    .select(PRODUCT_SNAPSHOT_FIELDS);

  if (error) return { ok: false, error: "unknown" };
  if (!restored || restored.length === 0) return { ok: false, error: "forbidden" };

  await recordAudit({
    action: "product.restored",
    targetType: "product",
    targetId: parsed.data.productId,
    metadata: {
      before: productSnapshot(current, images),
      after: productSnapshot(restored[0], images),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}
