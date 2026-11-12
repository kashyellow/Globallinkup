import { describe, expect, it } from "vitest";

import { inviteMemberSchema } from "./invite";

const base = { email: "ana@example.com", fullName: "Ana", locale: "en" };

describe("inviteMemberSchema", () => {
  it("normalises the email to trimmed lowercase", () => {
    const parsed = inviteMemberSchema.parse({ ...base, email: " Ana@Example.COM " });
    expect(parsed.email).toBe("ana@example.com");
  });

  it("rejects a malformed email", () => {
    expect(inviteMemberSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });

  it("requires a 2-60 character name after trimming", () => {
    expect(inviteMemberSchema.safeParse({ ...base, fullName: " A " }).success).toBe(false);
    expect(inviteMemberSchema.safeParse({ ...base, fullName: "Ana" }).success).toBe(true);
    expect(inviteMemberSchema.safeParse({ ...base, fullName: "x".repeat(61) }).success).toBe(false);
  });

  it("accepts only the app locales", () => {
    expect(inviteMemberSchema.safeParse({ ...base, locale: "fr" }).success).toBe(false);
    expect(inviteMemberSchema.safeParse({ ...base, locale: "es" }).success).toBe(true);
  });
});
