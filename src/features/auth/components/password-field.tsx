"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function passwordChecks(value: string) {
  return {
    length: value.length >= 8,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    digit: /\d/.test(value),
  };
}

export function isStrongPassword(value: string) {
  return Object.values(passwordChecks(value)).every(Boolean);
}

/**
 * Password input with the eye toggle and the same rules the register and reset
 * forms use (`passwordSchema`): 8+ chars, lower and upper case, one digit.
 */
export function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete = "new-password",
  requirements = false,
  invalid = false,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  requirements?: boolean;
  invalid?: boolean;
}) {
  const t = useTranslations("Auth.register");
  const [visible, setVisible] = useState(false);
  const checks = passwordChecks(value);

  const rules = [
    { key: "length", ok: checks.length, label: t("ruleLength") },
    { key: "case", ok: checks.lower && checks.upper, label: t("ruleCase") },
    { key: "number", ok: checks.digit, label: t("ruleNumber") },
  ];

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-label-md text-label-md text-on-surface">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          minLength={8}
          maxLength={72}
          aria-invalid={invalid || undefined}
          className={cn(
            "min-h-11 w-full rounded-xl border bg-surface-dim px-3 pr-11 font-body-sm text-body-sm text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            invalid ? "border-danger-border" : "border-outline-variant",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? t("togglePassword") : t("togglePassword")}
          className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary hover:text-on-surface"
        >
          <Icon name={visible ? "visibility_off" : "visibility"} className="text-lg" />
        </button>
      </div>
      {requirements ? (
        <ul className="mt-1 grid gap-0.5 font-body-sm text-body-sm">
          {rules.map((rule) => (
            <li
              key={rule.key}
              className={cn(
                "flex items-center gap-1.5",
                rule.ok ? "text-success-text" : "text-text-muted",
              )}
            >
              <Icon name={rule.ok ? "check_circle" : "circle"} className="text-sm" />
              {rule.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
