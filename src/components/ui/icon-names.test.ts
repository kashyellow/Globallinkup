import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ICON_NAMES } from "./icon-names";

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|jsx?)$/.test(entry) && !/\.test\./.test(entry) ? [path] : [];
  });
}

describe("Material Symbols subset", () => {
  it("registers every statically named Icon", () => {
    const registered = new Set<string>(ICON_NAMES);
    const missing = new Set<string>();

    for (const file of sourceFiles(join(process.cwd(), "src"))) {
      if (file.endsWith("icon-names.ts")) continue;
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/<Icon\s+[^>]*name="([^"]+)"/g)) {
        if (!registered.has(match[1])) missing.add(match[1]);
      }
    }

    expect([...missing].sort()).toEqual([]);
  });
});
