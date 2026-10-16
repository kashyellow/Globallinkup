import { describe, expect, it } from "vitest";

import { savePersonaSchema } from "./persona";

const valid = {
  fullName: "Sofia Martinez",
  country: "ES",
  city: "Barcelona",
  originFlavor: "El Born",
  dateOfBirth: "1999-04-12",
  languages: [{ code: "ES", level: "native" }],
  interests: ["architecture", "photography", "espresso"],
  bio: "Architect and ceramicist based in El Born.",
  instagram: "@sofia.mtz_bcn",
  chat: "@sofia.bcn",
};

describe("savePersonaSchema", () => {
  it("accepts a complete persona", () => {
    expect(savePersonaSchema.safeParse(valid).success).toBe(true);
  });

  it("allows the optional fields to be empty or omitted", () => {
    const { originFlavor, dateOfBirth, instagram, chat, ...rest } = valid;
    void originFlavor;
    void dateOfBirth;
    void instagram;
    void chat;
    expect(savePersonaSchema.safeParse(rest).success).toBe(true);
    expect(
      savePersonaSchema.safeParse({
        ...rest,
        originFlavor: "",
        dateOfBirth: "",
        instagram: "",
        chat: "",
      }).success,
    ).toBe(true);
  });

  it("requires at least three interests", () => {
    expect(savePersonaSchema.safeParse({ ...valid, interests: ["a", "b"] }).success).toBe(false);
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
