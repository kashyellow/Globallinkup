import type { LegalBlock } from "./types";

/**
 * Inline token the legal content uses where the Privacy Policy link belongs.
 * The policy is not authored yet, so the renderer swaps it for a non-link
 * placeholder instead of a dead `href="#"`.
 */
export const PRIVACY_POLICY_TOKEN = "{{privacy-policy-link}}";

/**
 * Parse the deliberately small markdown subset used by the legal content
 * files: `## ` headings, `- ` list items, blank-line separated paragraphs and
 * the inline privacy-policy token. Hand-authored content, so a full markdown
 * parser (and its dependency) would be overkill.
 */
export function parseLegalContent(markdown: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list.length > 0) {
      blocks.push({ type: "list", items: list });
      list = [];
    }
  };

  const flush = () => {
    flushList();
    flushParagraph();
  };

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();

    if (line.length === 0) {
      flush();
      continue;
    }

    if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "heading", text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flush();
  return blocks;
}
