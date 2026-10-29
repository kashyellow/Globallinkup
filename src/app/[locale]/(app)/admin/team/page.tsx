import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

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
  const [roleRows, adminRows, inviteRows] = await Promise.all([
    supabase
      .from("admin_roles")
      .select("id, slug, name, capabilities, is_system")
      .order("is_system", { ascending: false })
      .order("name", { ascending: true }),
    adminClient
      .from("profiles")
      .select("id, display_name, admin_role_id")
      .eq("role", "admin")
      .order("display_name", { ascending: true }),
    supabase
      .from("admin_invites")
      .select("id, email, admin_role_id")
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const roles = (unwrap(roleRows) ?? []).map((role) => ({
    id: role.id,
    slug: role.slug,
    name: role.name,
    capabilities: role.capabilities,
    isSystem: role.is_system,
  }));
  const roleName = new Map(roles.map((role) => [role.id, role.name]));

  return (
    <TeamView
      roles={roles}
      admins={(unwrap(adminRows) ?? []).map((admin) => ({
        id: admin.id,
        name: admin.display_name,
        roleId: admin.admin_role_id,
      }))}
      invites={(unwrap(inviteRows) ?? []).map((invite) => ({
        id: invite.id,
        email: invite.email,
        roleName: invite.admin_role_id ? (roleName.get(invite.admin_role_id) ?? "") : "",
        roleId: invite.admin_role_id,
      }))}
    />
  );
}
