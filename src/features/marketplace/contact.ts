/**
 * Link helpers for the marketplace concierge channels. Pure and client-safe:
 * the admin panel validates the raw values, these turn them into safe links.
 */

const MIN_PHONE_DIGITS = 8;
const MAX_PHONE_DIGITS = 15;

/** Digits only, so `tel:` and `wa.me` both accept the number as typed. */
export function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** A number that both a phone call and WhatsApp can use (country code included). */
export function isDialablePhone(value: string): boolean {
  const digits = phoneDigits(value);
  return digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS;
}

export function callHref(phone: string): string | null {
  if (!isDialablePhone(phone)) return null;
  return `tel:+${phoneDigits(phone)}`;
}

export function whatsappHref(phone: string, message: string): string | null {
  if (!isDialablePhone(phone)) return null;
  const text = message.trim();
  const base = `https://wa.me/${phoneDigits(phone)}`;
  return text.length > 0 ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Gmail's web composer. A `mailto:` hands the message to whatever mail app is
 * registered (often none on a desktop browser); this opens Gmail instead.
 */
export function gmailComposeHref(email: string, subject: string): string | null {
  const address = email.trim();
  if (!address.includes("@")) return null;
  const params = new URLSearchParams({ view: "cm", fs: "1", to: address });
  const title = subject.trim();
  if (title.length > 0) params.set("su", title);
  return `https://mail.google.com/mail/?${params.toString()}`;
}
