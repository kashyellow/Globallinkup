import { describe, expect, it } from "vitest";

import { parseLegalContent, PRIVACY_POLICY_TOKEN } from "./parse-legal";

describe("parseLegalContent", () => {
  it("splits headings, paragraphs and lists", () => {
    const blocks = parseLegalContent(
      ["## 1. Title", "", "First paragraph.", "", "- one", "- two", "", "Last."].join("\n"),
    );

    expect(blocks).toEqual([
      { type: "heading", text: "1. Title" },
      { type: "paragraph", text: "First paragraph." },
      { type: "list", items: ["one", "two"] },
      { type: "paragraph", text: "Last." },
    ]);
  });

  it("joins wrapped lines into a single paragraph", () => {
    const blocks = parseLegalContent("one line\ncontinues here\n");

    expect(blocks).toEqual([{ type: "paragraph", text: "one line continues here" }]);
  });

  it("keeps the privacy-policy token inline in the paragraph text", () => {
    const blocks = parseLegalContent(`Privacy Policy: ${PRIVACY_POLICY_TOKEN}\n`);

    expect(blocks).toEqual([
      { type: "paragraph", text: `Privacy Policy: ${PRIVACY_POLICY_TOKEN}` },
    ]);
  });

  it("returns no blocks for empty input", () => {
    expect(parseLegalContent("\n\n")).toEqual([]);
  });
});
