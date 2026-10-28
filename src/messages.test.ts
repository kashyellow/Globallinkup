import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `next-intl` treats "." as the nesting separator, so a message key that itself
 * contains a dot throws INVALID_KEY at runtime. This test keeps that constraint
 * honest and stops the two locales from drifting apart.
 */
type Messages = { [key: string]: string | Messages };

function load(locale: string): Messages {
  return JSON.parse(
    readFileSync(join(process.cwd(), "src/messages", `${locale}.json`), "utf8"),
  ) as Messages;
}

function dottedKeys(messages: Messages): string[] {
  return Object.entries(messages).flatMap(([key, value]) => [
    ...(key.includes(".") ? [key] : []),
    ...(typeof value === "object" ? dottedKeys(value) : []),
  ]);
}

function keyPaths(messages: Messages, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return [path, ...(typeof value === "object" ? keyPaths(value, path) : [])];
  });
}

describe("messages", () => {
  for (const locale of ["en", "es"] as const) {
    it(`${locale}: no key contains a dot`, () => {
      expect(dottedKeys(load(locale))).toEqual([]);
    });
  }

  it("en and es expose the same keys", () => {
    expect(keyPaths(load("es")).sort()).toEqual(keyPaths(load("en")).sort());
  });
});
