import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { Navbar } from "@/components/layout/navbar";
import { getPendingRequestCount } from "@/features/connect/queries";
import { getUnreadNotificationCount } from "@/features/notifications/queries";
import { RefreshProvider } from "@/features/shared/refresh-provider";
import { getServerClient, requireApprovedUser } from "@/lib/auth";
import { createSignedImageUrl } from "@/lib/storage";

/**
 * Signed-in application shell: fixed navbar + footer, plus a mobile tab bar
 * below `lg`. Access is enforced here (server-side): no session → login, no
 * profile → onboarding, not approved → /verify. The proxy stays optimistic only.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireApprovedUser();

  const [pendingRequests, notifications, viewerAvatar] = await Promise.all([
    getPendingRequestCount(profile.id),
    getUnreadNotificationCount(),
    (async () => {
      const supabase = await getServerClient();
      const avatarPath = profile.avatar_url;
      if (!avatarPath || !supabase) return null;
      return avatarPath.startsWith("http")
        ? avatarPath
        : createSignedImageUrl(supabase, "avatars", avatarPath);
    })(),
  ]);

  return (
    <RefreshProvider>
      <Navbar
        isAdmin={profile.role === "admin"}
        viewerName={profile.display_name}
        viewerAvatar={viewerAvatar}
        pendingRequests={pendingRequests}
        notifications={notifications}
      />
      <main className="min-h-[100dvh] w-full flex-1 bg-background pt-20">{children}</main>
      {/*
       * The fixed mobile tab bar overlays whatever sits at the very bottom of
       * the page, so the reserve lives on the footer instead of `<main>` —
       * otherwise the bar floats on top of the footer's last row.
       */}
      <div className="pb-24 lg:pb-0">
        <SiteFooter variant="app" />
      </div>
      <BottomNav pendingRequests={pendingRequests} />
    </RefreshProvider>
  );
}
