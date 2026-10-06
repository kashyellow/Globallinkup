import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("resolves conflicting Tailwind utilities to the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignores falsy values", () => {
    expect(cn("px-2", false && "hidden", undefined, null)).toBe("px-2");
  });

  it("supports conditional objects", () => {
    expect(cn("px-2", { "text-red-500": true, hidden: false })).toBe("px-2 text-red-500");
  });
});
