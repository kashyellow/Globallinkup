import { describe, expect, it } from "vitest";

import { applyRemember, readRemember, REMEMBER_MAX_AGE } from "./cookies";

describe("remember-me cookie options", () => {
  it("keeps Supabase defaults when no preference is stored", () => {
    const options = { maxAge: 100, path: "/" };
    expect(applyRemember(options, undefined)).toBe(options);
  });

  it("turns a remembered session into a 30-day cookie", () => {
    const options = { maxAge: 100, expires: new Date("2030-01-01"), path: "/" };
    expect(applyRemember(options, true)).toEqual({
      path: "/",
      maxAge: REMEMBER_MAX_AGE,
    });
  });

  it("turns an unchecked session into a session cookie", () => {
    const options = { maxAge: 100, expires: new Date("2030-01-01"), path: "/" };
    expect(applyRemember(options, false)).toEqual({ path: "/" });
  });

  it("reads only 1/0 as preferences", () => {
    expect(readRemember("1")).toBe(true);
    expect(readRemember("0")).toBe(false);
    expect(readRemember(undefined)).toBeUndefined();
    expect(readRemember("yes")).toBeUndefined();
  });
});
