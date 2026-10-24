import { describe, expect, it } from "vitest";

import { isMissingSessionError } from "./auth-errors";

describe("isMissingSessionError", () => {
  it("treats a deleted user JWT as a missing session", () => {
    expect(
      isMissingSessionError({
        code: "user_not_found",
        message: "User from sub claim in JWT does not exist",
      }),
    ).toBe(true);
  });

  it("treats an absent/expired session as logged out", () => {
    expect(isMissingSessionError({ name: "AuthSessionMissingError" })).toBe(true);
    expect(isMissingSessionError({ status: 401 })).toBe(true);
    expect(isMissingSessionError({ code: "session_expired" })).toBe(true);
  });

  it("does not swallow a real outage", () => {
    expect(isMissingSessionError({ status: 500, message: "fetch failed" })).toBe(false);
    expect(isMissingSessionError({ code: "over_request_rate_limit" })).toBe(false);
  });
});
