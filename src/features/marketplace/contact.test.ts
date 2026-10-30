import { describe, expect, it } from "vitest";

import { callHref, gmailComposeHref, isDialablePhone, phoneDigits, whatsappHref } from "./contact";

describe("phoneDigits", () => {
  it("keeps only the digits of a formatted number", () => {
    expect(phoneDigits("+57 (312) 849-2011")).toBe("573128492011");
  });

  it("returns an empty string when there is no number", () => {
    expect(phoneDigits("")).toBe("");
  });
});

describe("isDialablePhone", () => {
  it("accepts a country-code number", () => {
    expect(isDialablePhone("+34 612 849 201")).toBe(true);
  });

  it("rejects a number without a country code", () => {
    expect(isDialablePhone("312 849")).toBe(false);
  });

  it("rejects a number that is too long to be a phone number", () => {
    expect(isDialablePhone("1234567890123456")).toBe(false);
  });
});

describe("callHref", () => {
  it("builds a tel link from the digits", () => {
    expect(callHref("+34 612 849 201")).toBe("tel:+34612849201");
  });

  it("stays null until the admin fills a usable number", () => {
    expect(callHref("")).toBeNull();
    expect(callHref("1234")).toBeNull();
  });
});

describe("whatsappHref", () => {
  it("prefills the message and strips punctuation from the number", () => {
    expect(whatsappHref("+57 312 849 2011", "Is the bag available?")).toBe(
      "https://wa.me/573128492011?text=Is%20the%20bag%20available%3F",
    );
  });

  it("omits the query when there is no message", () => {
    expect(whatsappHref("+57 312 849 2011", "   ")).toBe("https://wa.me/573128492011");
  });

  it("stays null without a usable number", () => {
    expect(whatsappHref("", "Hello")).toBeNull();
  });
});

describe("gmailComposeHref", () => {
  it("opens the Gmail web composer with the subject", () => {
    expect(gmailComposeHref("concierge@globallinkup.com", "Inquiry about Loom")).toBe(
      "https://mail.google.com/mail/?view=cm&fs=1&to=concierge%40globallinkup.com&su=Inquiry+about+Loom",
    );
  });

  it("omits the subject when empty", () => {
    expect(gmailComposeHref("concierge@globallinkup.com", "")).toBe(
      "https://mail.google.com/mail/?view=cm&fs=1&to=concierge%40globallinkup.com",
    );
  });

  it("stays null until the admin fills an address", () => {
    expect(gmailComposeHref("", "Inquiry")).toBeNull();
    expect(gmailComposeHref("not-an-address", "Inquiry")).toBeNull();
  });
});
