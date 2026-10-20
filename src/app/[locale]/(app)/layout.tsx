import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getPendingRequestCount } from "@/features/connect/queries";
import { getServerClient, requireApprovedUser } from "@/lib/auth";
import { createSignedImageUrl } from "@/lib/storage";

/**
 * Signed-in application shell: fixed navbar + footer, plus a mobile tab bar
 * below `lg`. Access is enforced here (server-side): no session → login, no
 * profile → onboarding, not approved → /verify. The proxy stays optimistic only.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireApprovedUser();
  const pendingRequests = await getPendingRequestCount(profile.id);

  const supabase = await getServerClient();
  const avatarPath = profile.avatar_url;
  const viewerAvatar =
    !avatarPath || !supabase
      ? null
      : avatarPath.startsWith("http")
        ? avatarPath
        : await createSignedImageUrl(supabase, "avatars", avatarPath);

  return (
    <>
      <Navbar
        isAdmin={profile.role === "admin"}
        viewerName={profile.display_name}
        viewerAvatar={viewerAvatar}
        pendingRequests={pendingRequests}
      />
      <main className="min-h-[100dvh] w-full flex-1 bg-background pt-20">{children}</main>
      {/*
       * The fixed mobile tab bar overlays whatever sits at the very bottom of
       * the page, so the reserve lives on the footer instead of `<main>` —
       * otherwise the bar floats on top of the footer's last row.
       */}
      <div className="pb-24 lg:pb-0">
        <Footer />
      </div>
      <BottomNav pendingRequests={pendingRequests} />
    </>
  );
}
