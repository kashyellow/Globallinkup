import "server-only";

import { createSignedImageUrls, resolveImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/supabase/unwrap";

/**
 * S3e — the admin workstation. Everything here runs on the RLS client as an
 * admin (`profiles_select_admin`, `reports_select_admin`, admin write policies);
 * no service-role key is used.
 */

export type AdminProfileDto = {
  id: string;
  name: string;
  location: string;
  bio: string;
  headline: string | null;
  avatar: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  languages: string;
  submittedAt: string | null;
};

export type AdminReportDto = {
  id: string;
  reason: string;
  details: string | null;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
  targetType: "user" | "post";
  targetId: string | null;
  reporterName: string;
  targetName: string;
};

export type AdminProductDto = {
  id: string;
  name: string;
  origin: string;
  price: string;
  phone: string;
  description: string;
  isPublished: boolean;
  image: string | null;
};

export type AdminInterestDto = {
  id: string;
  label: string;
  status: "pending" | "approved" | "rejected";
  createdByName: string;
  createdAt: string;
};

export type AdminMetrics = {
  pendingProfiles: number;
  reportedPosts: number;
  curatedProducts: number;
  openReports: number;
  pendingInterests: number;
};

export type AdminData = {
  metrics: AdminMetrics;
  users: AdminProfileDto[];
  reports: AdminReportDto[];
  products: AdminProductDto[];
  interests: AdminInterestDto[];
};

export async function getAdminData(): Promise<AdminData> {
  const supabase = await createClient();

  const [profilesRes, reportsRes, productsRes, imagesRes, interestsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, city, country_code, bio_en, bio_es, headline, avatar_url, approval_status, languages, submitted_at, role",
      )
      .eq("role", "user")
      .order("submitted_at", { ascending: false, nullsFirst: false }),
    supabase
      .from("reports")
      .select(
        "id, reason, details, status, created_at, target_type, reporter_id, target_user_id, target_post_id",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("marketplace_products")
      .select(
        "id, name, origin_label, price_cents, currency, description, contact_information, is_published",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("marketplace_product_images")
      .select("product_id, storage_path, sort")
      .order("sort"),
    supabase
      .from("interest_catalog")
      .select("id, label, status, created_by, created_at")
      .in("status", ["pending", "approved"])
      .order("created_at", { ascending: true }),
  ]);

  const profiles = unwrap(profilesRes) ?? [];
  const reports = unwrap(reportsRes) ?? [];
  const products = unwrap(productsRes) ?? [];
  const images = unwrap(imagesRes) ?? [];
  const interests = unwrap(interestsRes) ?? [];

  const nameById = new Map(profiles.map((profile) => [profile.id, profile.display_name ?? ""]));

  const firstImageByProduct = new Map<string, string>();
  for (const image of images) {
    if (!firstImageByProduct.has(image.product_id)) {
      firstImageByProduct.set(image.product_id, image.storage_path);
    }
  }

  const [avatars, productImages] = await Promise.all([
    createSignedImageUrls(
      supabase,
      "avatars",
      profiles.map((profile) => profile.avatar_url),
    ),
    createSignedImageUrls(supabase, "product-images", [...firstImageByProduct.values()]),
  ]);

  const users: AdminProfileDto[] = profiles.map((profile) => ({
    id: profile.id,
    name: profile.display_name ?? "",
    location: [profile.city, profile.country_code].filter(Boolean).join(", "),
    bio: profile.bio_en ?? profile.bio_es ?? "",
    headline: profile.headline ?? null,
    avatar: resolveImageUrl(profile.avatar_url, avatars),
    status: profile.approval_status,
    languages: Array.isArray(profile.languages)
      ? (profile.languages as { code?: string }[])
          .map((entry) => entry?.code ?? "")
          .filter(Boolean)
          .join("/")
      : "",
    submittedAt: profile.submitted_at,
  }));

  const productDtos: AdminProductDto[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    origin: product.origin_label ?? "",
    price: `${(product.price_cents ?? 0) / 100} ${product.currency}`,
    phone: product.contact_information ?? "",
    description: product.description ?? "",
    isPublished: product.is_published,
    image: resolveImageUrl(firstImageByProduct.get(product.id), productImages),
  }));

  const interestDtos: AdminInterestDto[] = interests.map((interest) => ({
    id: interest.id,
    label: interest.label,
    status: interest.status,
    createdByName: nameById.get(interest.created_by ?? "") ?? "",
    createdAt: interest.created_at,
  }));

  const reportDtos: AdminReportDto[] = reports.map((report) => ({
    id: report.id,
    reason: report.reason,
    details: report.details,
    status: report.status,
    createdAt: report.created_at ?? "",
    targetType: report.target_type,
    targetId: report.target_type === "user" ? report.target_user_id : report.target_post_id,
    reporterName: nameById.get(report.reporter_id) ?? "",
    targetName:
      report.target_type === "user" ? (nameById.get(report.target_user_id ?? "") ?? "") : "post",
  }));

  return {
    metrics: {
      pendingProfiles: profiles.filter((profile) => profile.approval_status === "pending").length,
      reportedPosts: reports.filter(
        (report) => report.target_type === "post" && report.status === "open",
      ).length,
      curatedProducts: products.filter((product) => product.is_published).length,
      openReports: reports.filter((report) => report.status === "open").length,
      pendingInterests: interests.filter((interest) => interest.status === "pending").length,
    },
    users,
    reports: reportDtos,
    products: productDtos,
    interests: interestDtos,
  };
}
