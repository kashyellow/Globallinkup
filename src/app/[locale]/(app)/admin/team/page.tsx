import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TeamView } from "@/features/admin/components/team-view";
import { getAdminCapabilities } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
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
  const t = await getTranslations("Admin.team");

  if (!capabilities.includes("admins.manage")) {
    return (
      <div className="mx-auto max-w-3xl px-margin-mobile py-block md:px-margin">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{t("title")}</h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">{t("forbidden")}</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [roleRows, adminRows, inviteRows] = await Promise.all([
    supabase
      .from("admin_roles")
      .select("id, slug, name, capabilities, is_system")
      .order("is_system", { ascending: false })
      .order("name", { ascending: true }),
    supabase
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
        roleName: roleName.get(invite.admin_role_id) ?? "",
      }))}
    />
  );
}
