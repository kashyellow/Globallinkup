import { describe, expect, it } from "vitest";

import { forgotPasswordSchema, resetPasswordSchema, signInSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  const valid = { email: "User@Example.com ", password: "Password123", confirm: "Password123" };

  it("accepts a strong password and normalises the email", () => {
    const result = signUpSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects a weak password", () => {
    for (const password of ["short1A", "alllowercase1", "ALLUPPERCASE1", "NoDigitsHere"]) {
      expect(signUpSchema.safeParse({ ...valid, password, confirm: password }).success).toBe(false);
    }
  });

  it("rejects a mismatched confirmation", () => {
    expect(signUpSchema.safeParse({ ...valid, confirm: "Different123" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("only requires a present password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("validates the email shape", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("enforces the password policy and confirmation", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "Password123", confirm: "Password123" }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({ password: "weakpass", confirm: "weakpass" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ password: "Password123", confirm: "Password124" }).success,
    ).toBe(false);
  });
});
