import type { LanguageLevel } from "@/features/persona/data";

const CDN = "https://lh3.googleusercontent.com/aida-public/";

export type ConnectionLanguage = { code: string; level: LanguageLevel };

/** Accepted, mutually-consented connections with an unlocked contact vault. */
export type ActiveConnection = {
  id: string;
  name: string;
  age: number;
  location: string;
  neighborhood: string;
  avatar: string;
  avatarAlt: string;
  /** Used by the region filter pills. */
  region: "latam" | "europe";
  /** Resolved against `Connections.badges.*`. */
  badge: "ambassador" | "resident" | "creator";
  /** ISO date — rendered locale-aware as e.g. "Oct 2024". */
  connectedSince: string;
  languages: ConnectionLanguage[];
  /** Tag keys resolved against `Connections.tags.*`. */
  tags: string[];
  /** `whatsapp` or `whatsappTelegram` — resolved against `Connections.active.*`. */
  whatsappLabel: "whatsapp" | "whatsappTelegram";
  whatsappDisplay: string;
  whatsappRaw: string;
  instagram: string;
  instagramUrl: string;
  email: string;
};

export const ACTIVE_CONNECTIONS: ActiveConnection[] = [
  {
    id: "camila",
    name: "Camila Osorio",
    age: 25,
    location: "Medellín, Colombia",
    neighborhood: "El Poblado",
    avatar: `${CDN}AB6AXuBMbq5c2u_SQesIqoYf_z4aGRjHuBuuZljtIf2qkYYY94vsOwEBMfD0syNnV2tjAIv9uMRD0CoP0NgSXpWYI5Co4D_m69pXhThO1pMgLhOYFBexzKuKqka4xUdDhKmWb7z7HBxLpD6kAsgOVLMCNYul3vBRqgwtg4fh8OItYEtJqWRVWK49iABL90wYlVHtq5w4GBqQTZTQ1Y7qwj4SxCkl1CLA1Q_3GX-zLzHM3OC_0khJqATg1Ok4iA`,
    avatarAlt: "Editorial close portrait of Camila, a 25-year-old Colombian creative in Medellín.",
    region: "latam",
    badge: "ambassador",
    connectedSince: "2024-10-08T12:00:00Z",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "fluent" },
    ],
    tags: ["textiles", "botanicals", "analogFilm", "architecture"],
    whatsappLabel: "whatsapp",
    whatsappDisplay: "+57 312 849 2011",
    whatsappRaw: "+573128492011",
    instagram: "@camila.textiles",
    instagramUrl: "#",
    email: "camila@osorio.co",
  },
  {
    id: "mateo",
    name: "Mateo Silva",
    age: 29,
    location: "Mexico City, Mexico",
    neighborhood: "Roma Norte",
    avatar: `${CDN}AB6AXuB6xoIXhua6NnSM04VKnBqrxoxidpmbZG71CVESCOg9Z8zVX6lhyr9Rm7TeHBWxnpsQSyQwgMRxXBrxGc5nS13aEECIQ4vueFoLN8GY7SVALf7GEE93-girMuI0FYxWy4bIf5saIwAcjiBlBnmFJl_gfNe4kJ-RRD8zFWdnJclv0uqx-7jXOPZzy5fNys0clCCMJxdHO06nIDXSS4YWY1UwNPsMgdgkpv2BMbmnda8Csl9Zd0heQdP1sw`,
    avatarAlt:
      "Editorial portrait of Mateo, a 29-year-old Mexican architect in Roma Norte, Mexico City.",
    region: "latam",
    badge: "ambassador",
    connectedSince: "2024-09-19T12:00:00Z",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "advanced" },
    ],
    tags: ["brutalism", "ceramics", "coffeeCupping", "urbanWalk"],
    whatsappLabel: "whatsapp",
    whatsappDisplay: "+52 55 4910 8823",
    whatsappRaw: "+525549108823",
    instagram: "@mateo_silv",
    instagramUrl: "#",
    email: "mateo@silvaestudio.mx",
  },
  {
    id: "elena",
    name: "Elena Ramos",
    age: 28,
    location: "Madrid, Spain",
    neighborhood: "Chamberí",
    avatar: `${CDN}AB6AXuAYP7JQ-ax-8I1BzUKI6v4W_dq-SyyVh3XFnQPtcuxc8-dm0TDCtxE67562EkETWymGlb7k5hKnjtM7YbSjACERS_HgIiGPNWLOhz3sWNVPJzWCGRyLsiXuTeT3C_iiKu2SzfHz90e1nAa5dgqG16hf2MbgvJPBQOM-fwkBXT3JKo3n8AoBu6k8DQLxhlOGL-EJNA4r_NHGwaROGHBd5lJfRDJYDS-xyQqhiQTbmyP6orB__Cp7IjsqTw`,
    avatarAlt: "Editorial portrait of Elena Ramos, a 28-year-old Spanish art curator in Madrid.",
    region: "europe",
    badge: "resident",
    connectedSince: "2024-08-04T12:00:00Z",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "fluent" },
      { code: "FR", level: "basic" },
    ],
    tags: ["contemporaryArt", "gastronomy", "independentCinema"],
    whatsappLabel: "whatsappTelegram",
    whatsappDisplay: "+34 611 729 334",
    whatsappRaw: "+34611729334",
    instagram: "@elena_curaduria",
    instagramUrl: "#",
    email: "elena.ramos@curaduria.es",
  },
  {
    id: "lucas",
    name: "Lucas Varela",
    age: 31,
    location: "Buenos Aires, Argentina",
    neighborhood: "San Telmo",
    avatar: `${CDN}AB6AXuDQkJmtkmSmPRCxjU5AW3kl8jBJWr4nHhVy5dZelUT84Y0tSbDnWnGlAfJ-cG0qKxbu79ZKvewKprq2_vHg1TKc2AuRoGS156XTw4G9F5--TuvnUAz6JDAMWCqY75cu8GRc8K60lz9G-yOugVVR8MK533EpHJ8a-WRYkXfSVlplGQh39Cgo1FxHkGcfqxYvMZtoGBJtsSP7TUlT6-yHRr4kEbz5372hvmfyYqPrxtuKH7wH3XT7DJu41w`,
    avatarAlt:
      "Editorial portrait of Lucas Varela, a 31-year-old Argentine documentary filmmaker in Buenos Aires.",
    region: "latam",
    badge: "creator",
    connectedSince: "2024-07-22T12:00:00Z",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "conversational" },
      { code: "PT", level: "fluent" },
    ],
    tags: ["cinema", "vintageRecords", "cycling", "bookbindery"],
    whatsappLabel: "whatsapp",
    whatsappDisplay: "+54 9 11 3820 9140",
    whatsappRaw: "+5491138209140",
    instagram: "@lucasvarela.doc",
    instagramUrl: "#",
    email: "varela@surfilm.ar",
  },
];

/** Inbound invitations awaiting the viewer's decision (contact still masked). */
export type ReceivedRequest = {
  id: string;
  name: string;
  age: number;
  location: string;
  neighborhood: string;
  avatar: string;
  avatarAlt: string;
  languages: ConnectionLanguage[];
  /** Short relative age, e.g. "14h" / "1d". */
  sentAgo: string;
  /** The sender's own introduction letter — user-authored, not translated. */
  intro: string;
  /** Masked contact preview shown before consent. */
  maskedPreview: string;
};

export const RECEIVED_REQUESTS: ReceivedRequest[] = [
  {
    id: "daniel",
    name: "Daniel Rivera",
    age: 30,
    location: "Mexico City, Mexico",
    neighborhood: "Condesa",
    avatar: `${CDN}AB6AXuAnFMQYnWlVo0zmnA4PrEJ5ctHtMgQJ09ZPX20C5REgoXe4Lq840XHr_u9-w_oxDXJIDNr_LodsDKo9WKIMDmwRrrE71LMEPL_FtEOKNF-trR05ZGOpLRuKEgxAOTWNUCnlN0kY6YW-OSGFRYFhxWWzyv16ELvj_330LKGdEt780AKvuhxS_Wj8ZlujenY6OTgENkJ7VscIAqbAUqCG34pg162zA473OtP47UMH4c_iKJvMI2XuHmW6tA`,
    avatarAlt: "Warm portrait of Daniel Rivera, a 30-year-old Mexican architect.",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "fluent" },
    ],
    sentAgo: "14h",
    intro:
      "Hola Sofia! Loved your dispatch on Madrid's hidden brutalist pavilions. I lead historic urban walks in Mexico City and would love to exchange perspectives on preservation and cross-cultural architecture projects.",
    maskedPreview: "WhatsApp: +52 55 •••• •••• · Email: d••••@••••.mx",
  },
  {
    id: "valentina",
    name: "Valentina Gomez",
    age: 26,
    location: "Bogotá, Colombia",
    neighborhood: "Chapinero",
    avatar: `${CDN}AB6AXuAGv5Y7LQGRoWjU6CqNkpwWlGF1EsWq9VUpVAlHtmm7V4dkmcG8UUjlADtN6WdNGAMHNAbrE1TzhdAv383ObR9tikH-UGF2eHMcQVflenibUJ72z1QmCwJDqita46GLAzJ1BLK8MOH3qz21kJbzWRTbBPYNFu8hrbHskm0ZT9Gv_NQUIpRfaZXPQyOn94d3c6chHysVUH6H-HtflcbL0XCSdokOQphY7gyLu66xpAMEYOK5ZJUMHlfFnw`,
    avatarAlt: "Natural sunlight portrait of Valentina Gomez, a Colombian visual journalist.",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "advanced" },
    ],
    sentAgo: "1d",
    intro:
      "Hi Sofia! Interested in your analog photography dispatches. Visiting Madrid this coming spring for a photo residency and would love to connect directly beforehand.",
    maskedPreview: "WhatsApp: +57 300 •••• •••• · IG: @v••••••",
  },
];

/** Outbound invitations awaiting the other side's consent. */
export type SentRequest = {
  id: string;
  name: string;
  age: number;
  location: string;
  /** Topic keys resolved against `Connections.topics.*`. */
  topic: "artisanCeramics" | "publishingTravel";
  avatar: string;
  avatarAlt: string;
  sentAgo: string;
};

export const SENT_REQUESTS: SentRequest[] = [
  {
    id: "andres",
    name: "Andrés Molina",
    age: 32,
    location: "Oaxaca, Mexico",
    topic: "artisanCeramics",
    avatar: `${CDN}AB6AXuA5P9OwXuCmdOaFAoUaQB_l8P5OQ2ffE1G_UAmiH-ChK--uOOdlhR510A3Y8a6RPgW_NDSXblvVaWvfwMYp2d2ymOAmi-NMtwe8pqmc2ZHxp7Rq18PKEfbglL51WlmSuuVOLmQnL57ZNrpiEcYDpdK5XVBQ8CNPOYK_HpIhhVveA_HfYvOK62cxuTR89VLgG5cBTTfWv58MldlRIsjGpx9TiTlJOz2oCO1D0hWxvgSmVr05mt_xy1C9JQ`,
    avatarAlt: "Editorial portrait of Andrés Molina, a ceramicist in Oaxaca, Mexico.",
    sentAgo: "2 days",
  },
  {
    id: "carla",
    name: "Carla Rossi",
    age: 27,
    location: "Barcelona, Spain",
    topic: "publishingTravel",
    avatar: `${CDN}AB6AXuCTvSkHLDamLhz3FaBu2VZrc77JdMrTXl67c0XTDLVOH95akaFNblZZ_nYHfpKtanDwQotKsZvKTKb5_hqwutbqFDZECTbTG54NfliV8fF3cr2jm-GKuSMn69Z7xRJSJw7QbF3GuiuOpJYYXbIGrx8djxvadJqKP7rPgqPpqz1owWKoJ_wgvzxWP7UHQufwAsXCV_Q43ICZjcxntX-5uA9ets0b4Y-N5-Vo2BWayIuzo7dHpdmqRrPRjA`,
    avatarAlt: "Editorial portrait of Carla Rossi, a lifestyle writer in Barcelona.",
    sentAgo: "4 days",
  },
];

export const CONNECTION_TABS = ["active", "requests", "sent", "archived"] as const;
export type ConnectionTab = (typeof CONNECTION_TABS)[number];

export const REGION_FILTERS = ["all", "latam", "europe", "recent"] as const;
export type RegionFilter = (typeof REGION_FILTERS)[number];
