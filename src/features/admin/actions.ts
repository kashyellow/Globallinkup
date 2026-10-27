"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uuidSchema } from "@/lib/validation/ids";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * S3e — admin operations. All run on the RLS client: the admin policies plus the
 * guard's admin bypass cover them, so no service-role key is needed. The admin
 * check is done without redirecting (Server Actions cannot use `getLocale()`).
 */

export type AdminResult = { ok: true } | { ok: false; error: string };

async function requireAdminClient() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.role !== "admin" || profile.approval_status !== "approved") {
    return null;
  }
  return { user, supabase: await createClient() };
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
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data, error } = await ctx.supabase.rpc("review_persona", {
    p_profile_id: parsed.data.profileId,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason ?? undefined,
  });

  if (error || data !== true) return { ok: false, error: "unknown" };
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
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: updated, error } = await ctx.supabase
    .from("reports")
    .update({
      status: parsed.data.status,
      resolved_by: ctx.user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.reportId)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };
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
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = removePostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: current, error: readError } = await ctx.supabase
    .from("posts")
    .select("id, state")
    .eq("id", parsed.data.postId)
    .maybeSingle();

  if (readError) return { ok: false, error: "unknown" };
  if (!current) return { ok: false, error: "forbidden" };

  const now = new Date();
  const { data: updated, error } = await ctx.supabase
    .from("posts")
    .update({
      state: "removed",
      previous_state: current.state === "removed" ? "visible" : current.state,
      removed_by: ctx.user.id,
      removed_at: now.toISOString(),
      removed_reason: parsed.data.reason ?? "Removed by moderation.",
      purge_after: new Date(now.getTime() + PURGE_WINDOW_DAYS * 86_400_000).toISOString(),
    })
    .eq("id", parsed.data.postId)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };

  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/posts");
  revalidatePath("/profile");
  return { ok: true };
}

/** Undo a removal while the appeal window is open. */
export async function restorePostAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: current, error: readError } = await ctx.supabase
    .from("posts")
    .select("id, state, previous_state")
    .eq("id", parsed.data.postId)
    .maybeSingle();

  if (readError) return { ok: false, error: "unknown" };
  if (!current) return { ok: false, error: "forbidden" };
  if (current.state !== "removed") return { ok: true };

  const target = current.previous_state ?? "visible";
  const { data: updated, error } = await ctx.supabase
    .from("posts")
    .update({
      state: target,
      archived_at: target === "archived" ? new Date().toISOString() : null,
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

  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/posts");
  revalidatePath("/profile");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Cultural-interest review (S6)
// ---------------------------------------------------------------------------
const interestReviewSchema = z.object({
  interestId: uuidSchema,
  decision: z.enum(["approved", "rejected"]),
});

export async function reviewInterestAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = interestReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data, error } = await ctx.supabase.rpc("review_interest", {
    p_interest_id: parsed.data.interestId,
    p_decision: parsed.data.decision,
  });

  if (error || data !== true) return { ok: false, error: "unknown" };

  revalidatePath("/admin");
  revalidatePath("/admin/interests");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Marketplace CRUD
// ---------------------------------------------------------------------------
const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  priceCents: z.number().int().min(0).max(100_000_000),
  currency: z.string().trim().length(3).default("USD"),
  description: z.string().trim().max(2000).optional(),
  originLabel: z.string().trim().max(120).optional(),
  /** Phone for the seller contact line on the public catalog. */
  sellerPhone: z.string().trim().max(60).optional(),
  isPublished: z.boolean().default(false),
  imagePaths: z.array(z.string().trim().min(1).max(400)).max(10).default([]),
});

export async function createProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
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
      contact_information: data.sellerPhone ?? null,
      is_published: data.isPublished,
      created_by: ctx.user.id,
    })
    .select("id")
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

  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}

const updateSchema = productSchema.extend({ productId: uuidSchema });

export async function updateProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  if (data.isPublished && data.imagePaths.length === 0) {
    return { ok: false, error: "invalid" };
  }

  const { data: updated, error } = await ctx.supabase
    .from("marketplace_products")
    .update({
      name: data.name,
      price_cents: data.priceCents,
      currency: data.currency,
      description: data.description ?? null,
      origin_label: data.originLabel ?? null,
      contact_information: data.sellerPhone ?? null,
      is_published: data.isPublished,
    })
    .eq("id", data.productId)
    .select("id");

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

  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}

const publishSchema = z.object({ productId: uuidSchema, isPublished: z.boolean() });

export async function setProductPublishedAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: updated, error } = await ctx.supabase
    .from("marketplace_products")
    .update({ is_published: parsed.data.isPublished })
    .eq("id", parsed.data.productId)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };
  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}

const productIdSchema = z.object({ productId: uuidSchema });

export async function deleteProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  // Soft delete (Phase 0 schema): the row and its images stay recoverable from
  // the admin Trash view. Public queries exclude `deleted_at is not null`.
  const { data: deleted, error } = await ctx.supabase
    .from("marketplace_products")
    .update({ deleted_at: new Date().toISOString(), is_published: false })
    .eq("id", parsed.data.productId)
    .is("deleted_at", null)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!deleted || deleted.length === 0) return { ok: false, error: "forbidden" };
  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}

const restoreSchema = z.object({ productId: uuidSchema });

export async function restoreProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = restoreSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data, error } = await ctx.supabase
    .from("marketplace_products")
    .update({ deleted_at: null })
    .eq("id", parsed.data.productId)
    .not("deleted_at", "is", null)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!data || data.length === 0) return { ok: false, error: "forbidden" };
  revalidatePath("/admin");
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true };
}
