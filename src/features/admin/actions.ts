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
});

export async function reviewPersonaAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { data: updated, error } = await ctx.supabase
    .from("profiles")
    .update({
      approval_status: parsed.data.decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: ctx.user.id,
    })
    .eq("id", parsed.data.profileId)
    .select("id");

  if (error) return { ok: false, error: "unknown" };
  if (!updated || updated.length === 0) return { ok: false, error: "forbidden" };
  revalidatePath("/admin");
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

  const { error } = await ctx.supabase
    .from("reports")
    .update({
      status: parsed.data.status,
      resolved_by: ctx.user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.reportId);

  if (error) return { ok: false, error: "unknown" };
  revalidatePath("/admin");
  return { ok: true };
}

const postSchema = z.object({ postId: uuidSchema });

export async function removePostAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { error } = await ctx.supabase
    .from("posts")
    .update({
      moderation_status: "removed",
      removed_by: ctx.user.id,
      removed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.postId);

  if (error) return { ok: false, error: "unknown" };
  revalidatePath("/admin");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Marketplace CRUD
// ---------------------------------------------------------------------------
const productSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: z.enum(["artisanCrafts", "homeLiving", "booksCulture", "localGoods", "travelGear"]),
  priceCents: z.number().int().min(0).max(100_000_000),
  currency: z.string().trim().length(3).default("USD"),
  summary: z.string().trim().max(400).optional(),
  description: z.string().trim().max(2000).optional(),
  originLabel: z.string().trim().max(120).optional(),
  availability: z.enum(["in_stock", "out_of_stock", "made_to_order"]).default("in_stock"),
  contactInformation: z.string().trim().max(200).optional(),
  isPublished: z.boolean().default(false),
  imagePath: z.string().trim().max(400).optional(),
});

export async function createProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  const { data: created, error } = await ctx.supabase
    .from("marketplace_products")
    .insert({
      name: data.name,
      category: data.category,
      price_cents: data.priceCents,
      currency: data.currency,
      summary: data.summary ?? null,
      description: data.description ?? null,
      origin_label: data.originLabel ?? null,
      availability: data.availability,
      contact_information: data.contactInformation ?? null,
      is_published: data.isPublished,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !created) return { ok: false, error: "unknown" };

  if (data.imagePath) {
    await ctx.supabase
      .from("marketplace_product_images")
      .insert({ product_id: created.id, storage_path: data.imagePath, sort: 0 });
  }

  revalidatePath("/admin");
  revalidatePath("/marketplace");
  return { ok: true };
}

const publishSchema = z.object({ productId: uuidSchema, isPublished: z.boolean() });

export async function setProductPublishedAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { error } = await ctx.supabase
    .from("marketplace_products")
    .update({ is_published: parsed.data.isPublished })
    .eq("id", parsed.data.productId);

  if (error) return { ok: false, error: "unknown" };
  revalidatePath("/admin");
  revalidatePath("/marketplace");
  return { ok: true };
}

const productIdSchema = z.object({ productId: uuidSchema });

export async function deleteProductAction(input: unknown): Promise<AdminResult> {
  const ctx = await requireAdminClient();
  if (!ctx) return { ok: false, error: "forbidden" };

  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { error } = await ctx.supabase
    .from("marketplace_products")
    .delete()
    .eq("id", parsed.data.productId);

  if (error) return { ok: false, error: "unknown" };
  revalidatePath("/admin");
  revalidatePath("/marketplace");
  return { ok: true };
}
