"use client";

import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { cn } from "@/lib/utils";
import { callHref, gmailComposeHref, whatsappHref } from "../contact";
import type { MarketplaceContact } from "../queries";

const PRIMARY =
  "flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px";
const SECONDARY =
  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-dim px-4 font-label-lg text-label-lg font-semibold text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px";

type Action = { href: string; icon: string; label: string; external: boolean };

/**
 * The marketplace is ordered through a human concierge, so the dialog links to
 * whichever channels an admin has configured. Until both are empty, members get
 * a warning instead of a button that goes nowhere.
 */
export function ConciergeActions({
  contact,
  emailSubject,
  whatsappMessage,
  labels,
}: {
  contact: MarketplaceContact;
  emailSubject: string;
  whatsappMessage: string;
  labels: { email: string; whatsapp: string; call: string; unavailable: string };
}) {
  const email = gmailComposeHref(contact.email, emailSubject);
  const whatsapp = whatsappHref(contact.phone, whatsappMessage);
  const call = callHref(contact.phone);

  if (!email && !whatsapp && !call) {
    return <InlineAlert tone="warning">{labels.unavailable}</InlineAlert>;
  }

  const actions: Action[] = [];
  if (email) actions.push({ href: email, icon: "mail", label: labels.email, external: true });
  if (whatsapp) {
    actions.push({ href: whatsapp, icon: "chat", label: labels.whatsapp, external: true });
  }
  if (call) actions.push({ href: call, icon: "call", label: labels.call, external: false });

  const [primary, ...secondary] = actions;

  return (
    <div className="flex flex-col gap-space-sm">
      <a
        href={primary.href}
        {...(primary.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={PRIMARY}
      >
        <Icon name={primary.icon} className="text-xl" />
        {primary.label}
      </a>
      {secondary.length > 0 ? (
        <div className="flex flex-col gap-space-sm sm:flex-row">
          {secondary.map((action) => (
            <a
              key={action.href}
              href={action.href}
              {...(action.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={cn(SECONDARY)}
            >
              <Icon name={action.icon} className="text-lg" />
              {action.label}
            </a>
          ))}
        </div>
      ) : null}
      {contact.email ? (
        <p className="text-center font-body-sm text-body-sm break-all text-secondary">
          {contact.email}
        </p>
      ) : null}
    </div>
  );
}
