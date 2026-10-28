import { describe, expect, it } from "vitest";

import { logError, redact } from "./log";

const BANNED = [
  "email",
  "password",
  "token",
  "authorization",
  "apikey",
  "phone",
  "whatsapp",
  "telegram",
  "instagram",
  "facebook",
  "tiktok",
  "date_of_birth",
  "body",
  "caption",
  "reason",
];

describe("redact", () => {
  it("strips every banned key, including nested ones", () => {
    const input = Object.fromEntries(BANNED.map((key) => [key, "leak"]));
    const result = redact({ ...input, nested: { email: "a@b.c", postId: "p1" } }) as Record<
      string,
      unknown
    >;

    for (const key of BANNED) expect(result[key]).toBe("[redacted]");
    expect((result.nested as Record<string, unknown>).email).toBe("[redacted]");
    expect((result.nested as Record<string, unknown>).postId).toBe("p1");
  });

  it("keeps ids and outcomes intact", () => {
    const result = redact({ actorId: "u1", action: "post.removed", outcome: "ok" }) as Record<
      string,
      unknown
    >;
    expect(result).toEqual({ actorId: "u1", action: "post.removed", outcome: "ok" });
  });
});

describe("logError", () => {
  it("never prints a banned value", () => {
    const lines: string[] = [];
    const original = console.error;
    console.error = (line: string) => lines.push(line);
    try {
      logError("test", { email: "leak@example.com", postId: "p1" });
    } finally {
      console.error = original;
    }
    expect(lines.join("\n")).not.toContain("leak@example.com");
    expect(lines.join("\n")).toContain("[redacted]");
  });
});
