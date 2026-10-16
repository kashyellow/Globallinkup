import { z } from "zod";

/**
 * Auth input schemas (S2). Shared by the Server Actions and unit-tested in
 * `auth.test.ts`. The password rules mirror the register/reset UI and the
 * Supabase policy (CFG-1): >= 8 chars with lower + upper + digit.
 */

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const passwordSchema = z
  .string()
  .min(8, "passwordTooShort")
  .regex(/[a-z]/, "passwordNeedsLower")
  .regex(/[A-Z]/, "passwordNeedsUpper")
  .regex(/\d/, "passwordNeedsDigit");

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "passwordMismatch",
  });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "passwordRequired"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  /** The active locale, sent by the client (Server Actions have no route). */
  locale: z.enum(["en", "es"]),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "passwordMismatch",
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
