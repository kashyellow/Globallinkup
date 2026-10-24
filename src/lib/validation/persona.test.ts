import { describe, expect, it } from "vitest";

import { savePersonaSchema } from "./persona";

const valid = {
  fullName: "Sofia Martinez",
  country: "ES",
  city: "Barcelona",
  dateOfBirth: "1999-04-12",
  languages: [{ code: "ES", level: "native" }],
  interests: ["architecture", "photography", "espresso"],
  bio: "Architect and ceramicist based in El Born.",
  whatsapp: "+34 612 345 678",
  instagram: "@sofia.mtz_bcn",
  locale: "en",
};

describe("savePersonaSchema", () => {
  it("accepts a complete persona", () => {
    expect(savePersonaSchema.safeParse(valid).success).toBe(true);
  });

  it("allows the unused channels and the date of birth to be empty or omitted", () => {
    const { dateOfBirth, instagram, ...rest } = valid;
    void dateOfBirth;
    void instagram;
    expect(savePersonaSchema.safeParse(rest).success).toBe(true);
    expect(
      savePersonaSchema.safeParse({
        ...rest,
        dateOfBirth: "",
        instagram: "",
        telegram: "",
        facebook: "",
        tiktok: "",
        x: "",
      }).success,
    ).toBe(true);
  });

  it("requires at least one contact channel", () => {
    expect(
      savePersonaSchema.safeParse({
        ...valid,
        whatsapp: "",
        telegram: "",
        instagram: "",
        facebook: "",
        tiktok: "",
        x: "",
      }).success,
    ).toBe(false);
  });

  it("requires at least three interests", () => {
    expect(
      savePersonaSchema.safeParse({
        ...valid,
        interests: ["architecture", "photography"],
      }).success,
    ).toBe(false);
  });

  it("accepts user-created cultural interests", () => {
    expect(
      savePersonaSchema.safeParse({
        ...valid,
        interests: ["architecture", "pottery", "Afro-Caribbean dance"],
      }).success,
    ).toBe(true);
  });

  it("rejects links, handles and contact-like custom interests", () => {
    expect(
      savePersonaSchema.safeParse({
        ...valid,
        interests: ["architecture", "pottery", "visit www.example.com"],
      }).success,
    ).toBe(false);
    expect(
      savePersonaSchema.safeParse({
        ...valid,
        interests: ["architecture", "pottery", "@sofia"],
      }).success,
    ).toBe(false);
  });

  it("rejects case-insensitive duplicate interests", () => {
    expect(
      savePersonaSchema.safeParse({
        ...valid,
        interests: ["pottery", "Pottery", "architecture"],
      }).success,
    ).toBe(false);
  });

  it("caps interests at twenty", () => {
    const interests = Array.from({ length: 21 }, (_, index) => `interest ${"a".repeat(index + 1)}`);
    expect(savePersonaSchema.safeParse({ ...valid, interests }).success).toBe(false);
  });

  it("requires a two-letter country code", () => {
    expect(savePersonaSchema.safeParse({ ...valid, country: "ESP" }).success).toBe(false);
  });

  it("rejects a malformed date of birth", () => {
    expect(savePersonaSchema.safeParse({ ...valid, dateOfBirth: "12/04/1999" }).success).toBe(
      false,
    );
  });

  it("caps the bio at 160 characters", () => {
    expect(savePersonaSchema.safeParse({ ...valid, bio: "x".repeat(161) }).success).toBe(false);
  });
});
