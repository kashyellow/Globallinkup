import type { ReactNode } from "react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

/** Unauthenticated shell: auth header + footer (login, register, verify, persona setup). */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="w-full grow bg-background pt-20">{children}</main>
      <PublicFooter />
    </>
  );
}
