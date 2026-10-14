import { Fragment } from "react";

import { parseLegalContent, PRIVACY_POLICY_TOKEN } from "../parse-legal";
import type { LegalDocument } from "../types";
import { PrivacyPolicyLink } from "./privacy-policy-link";

function Paragraph({ text }: { text: string }) {
  const parts = text.split(PRIVACY_POLICY_TOKEN);

  return (
    <p className="font-body-md text-body-md leading-relaxed text-secondary">
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part}
          {index < parts.length - 1 ? <PrivacyPolicyLink /> : null}
        </Fragment>
      ))}
    </p>
  );
}

/** Renders a parsed legal document. Server component — no interactivity here. */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  const blocks = parseLegalContent(document.body);

  return (
    <article className="flex flex-col gap-space-md">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h2
              key={index}
              className="pt-space-sm font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "list") {
          return (
            <ul
              key={index}
              className="flex list-disc flex-col gap-1.5 pl-5 font-body-md text-body-md text-secondary marker:text-primary"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }

        return <Paragraph key={index} text={block.text} />;
      })}
    </article>
  );
}
