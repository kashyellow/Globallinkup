/**
 * Structured logging with PII redaction (ADR 0003). Log ids and outcomes, never
 * content: emails, contact channels, birthdays, captions and bodies are stripped
 * before serialising, and a unit test fails if any of them survive.
 */
const BANNED = new Set([
  "email",
  "password",
  "token",
  "authorization",
  "apikey",
  "phone",
  "whatsapp",
  "telegram",
  "instagram",
  "facebook",
  "tiktok",
  "date_of_birth",
  "body",
  "caption",
  "reason",
]);

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = BANNED.has(key.toLowerCase()) ? "[redacted]" : redact(item, depth + 1);
  }
  return out;
}

export type LogLevel = "info" | "warn" | "error";

function emit(level: LogLevel, event: string, fields: Record<string, unknown>) {
  const line = { level, event, at: new Date().toISOString(), ...(redact(fields) as object) };
  const text = JSON.stringify(line);
  if (level === "error") console.error(text);
  else if (level === "warn") console.warn(text);
  else console.info(text);
}

export function logInfo(event: string, fields: Record<string, unknown> = {}) {
  emit("info", event, fields);
}
export function logWarn(event: string, fields: Record<string, unknown> = {}) {
  emit("warn", event, fields);
}
export function logError(event: string, fields: Record<string, unknown> = {}) {
  emit("error", event, fields);
}
