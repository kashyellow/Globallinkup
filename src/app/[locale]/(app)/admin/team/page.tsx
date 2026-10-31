import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { accessFromCapabilities } from "@/features/admin/desks";
import { TeamView } from "@/features/admin/components/team-view";
import { getAdminCapabilities } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/supabase/unwrap";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Admin.team" });
  return { title: t("title") };
}

export default async function AdminTeamPage() {
  await requireAdmin();
  const capabilities = await getAdminCapabilities();

  if (!capabilities.includes("admins.manage")) notFound();

  const supabase = await createClient();
  // `profiles` reads are gated by `members.review`, not `admins.manage`, so the
  // session client cannot list admins here. The capability check above already
  // authorized this screen; the service role only reads the account list.
  const adminClient = createAdminClient();
  const [roleRows, adminRows] = await Promise.all([
    supabase.from("admin_roles").select("id, capabilities"),
    adminClient
      .from("profiles")
      .select("id, display_name, admin_role_id")
      .eq("role", "admin")
      .order("display_name", { ascending: true }),
  ]);

  const roles = new Map(
    (unwrap(roleRows) ?? []).map((role) => [role.id, role.capabilities] as const),
  );
  const capabilitiesOf = (roleId: string | null) => (roleId ? (roles.get(roleId) ?? []) : []);

  const admins = await Promise.all(
    (unwrap(adminRows) ?? []).map(async (admin) => {
      const capabilities = capabilitiesOf(admin.admin_role_id);
      const isOwner = capabilities.includes("admins.manage");
      // The owner reads each sub-admin's login email; passwords are hashed and
      // cannot be read back.
      const email = isOwner
        ? ""
        : ((await adminClient.auth.admin.getUserById(admin.id)).data.user?.email ?? "");
      return {
        id: admin.id,
        name: admin.display_name,
        email,
        isOwner,
        access: accessFromCapabilities(capabilities),
      };
    }),
  );

  return <TeamView admins={admins} />;
}
