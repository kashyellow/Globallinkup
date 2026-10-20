const CDN = "https://lh3.googleusercontent.com/aida-public/";

export type LanguageLevel =
  "native" | "fluent" | "advanced" | "conversational" | "proficient" | "basic";

export type PersonaLanguage = {
  code: string;
  level: LanguageLevel;
};

export type ConnectState = "none" | "requested" | "received" | "connected" | "declined";

export type Persona = {
  id: string;
  name: string;
  age: number;
  /** ISO-3166 alpha-2, used by the discovery region filter. */
  countryCode: string;
  location: string;
  /** Storage-backed URL, or `null` when the member has no photo yet. */
  image: string | null;
  imageAlt: string;
  languages: PersonaLanguage[];
  /** Interest keys resolved against `Discover.interests.*`. */
  interests: string[];
  state: ConnectState;
  /** Present when a connection row already exists (requested/received/declined). */
  connectionId?: string;
  badge?: "previewed" | "directContact";
};

/** Demo discovery results (see Reference/discover.html). */
export const PERSONAS: Persona[] = [
  {
    id: "sofia",
    name: "Sofia Martinez",
    countryCode: "ES",
    age: 27,
    location: "Barcelona, Spain",
    image: `${CDN}AB6AXuAATlSmkEIUqeeL2L5XxBOU6w03gzVzBw2Uzhhca7DwdYW4hDZd4o2AHMBhf1TzL67D6LizWd-FlfVA5rzm36kc_qs9lanO29UHXGB-OSFZtqfLJCv-9QAADdrJu-b1MpnO7Bk7BE5yKrjUuUxCafSczIqtPSB73rF_OXuT5UwFZcwTK2wqBodkDNA66r01n5t9K7H5kFx9Lg8ZtrZYW1pwWrb9focCtsu1qILGbUffIAcWXP7LwBQmuw`,
    imageAlt:
      "Editorial portrait of Sofia, a 27-year-old Spanish photographer standing in the Gothic Quarter of Barcelona.",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "fluent" },
    ],
    interests: ["architecture", "photography", "espresso"],
    state: "none",
    badge: "previewed",
  },
  {
    id: "mateo",
    name: "Mateo Silva",
    countryCode: "MX",
    age: 29,
    location: "Mexico City, Mexico",
    image: `${CDN}AB6AXuAsDzM2RNR9BY6i5VzL0EbJF_w1502U12J8JL1mG05WCaJ24FZSgKODBd2MN4rWbBTUypP8rsu5ufs2CMKY4J4PLylElUYFgXno8jNotEfdlV_Zz4528eRkweSu7S03O7xalM--Nuy2qm-MlBolHefzEB6btVIZxrboJ6VuaWyyvMoL21MGPIXzzcI5w823JBzArY2mL72vRnOsbW2F4u8tR3Dk2R-IMtqJfMqVvGmVXUD_Hec39WHX6g`,
    imageAlt:
      "Candid daylight portrait of Mateo, a 29-year-old creative director from Mexico City in a cafe courtyard.",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "conversational" },
    ],
    interests: ["artDirection", "gastronomy", "cinema"],
    state: "requested",
  },
  {
    id: "camila",
    name: "Camila Osorio",
    countryCode: "CO",
    age: 25,
    location: "Medellín, Colombia",
    image: `${CDN}AB6AXuCVN6oxLiJaptBLRjlvsIv4UABbzpGBGL4M_QhQRrzGZY6mGVI3crDtAd87MLKCVKaZUYGVjAMsUbmCr56p-LzRucmiwErZCTDku9yt92t4JIKU6eby7yFzMIPTnkoipTWflzhGlw_lTsj5K8Ud36rbyKbaek0HcirDUi2ZwM61cWQ2xK0WEnjOu6UW8jfJMFPfGaQhjNypr9_zGN3j7q2FqjnVj59vy5gp4VwUIrLNyW5zfR1OReid5Q`,
    imageAlt: "Editorial portrait of Camila, a 25-year-old textile curator in Medellín, Colombia.",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "proficient" },
    ],
    interests: ["textiles", "hiking", "botanicals"],
    state: "connected",
    badge: "directContact",
  },
  {
    id: "lucas",
    name: "Lucas Varela",
    countryCode: "AR",
    age: 31,
    location: "Buenos Aires, Argentina",
    image: `${CDN}AB6AXuAWEA5Ma66iabLs-eTq8UnKMF7QVaml_BBInsD6JNx0i57X38F9a6jKrfW186jlqtA81r2IVWBtE-l6v0joXLLrPkaQf5tG7vxu25ZaPPT99eYTrAHYbkQOr0Ws2IKDvJK4r6x2ww6XLy8nGbydnczuoQc1zV1yZ_nXTspBlkhkBcLDJsF43R5rB0SZ4HPfTbh_Y9d99dbLeYKWK8C3yqw83G1YVCOMB2UhivFvG5lZYoqIH4YHtbAXqQ`,
    imageAlt:
      "Natural daylight portrait of Lucas, a 31-year-old sound designer and author from Buenos Aires, Argentina.",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "conversational" },
    ],
    interests: ["soundArt", "literature", "vinyl"],
    state: "none",
  },
  {
    id: "elena",
    name: "Elena Ramos",
    countryCode: "ES",
    age: 28,
    location: "Madrid, Spain",
    image: `${CDN}AB6AXuD1LOYGbXcq8b5SqOnWVUvT6cF1lpcAZJt5sJxgcTO8ENExuZORmWOtzga76FrztDQRjapBoUzZLRyLfDDrNocU4swCFy_G90neGbLIxcNtRIqa0QyYcI9pwrYzgXIUjehAk-c_MW8c8asf18fCL6kzv7JiA7GbjDe3Qmcj6owxIn67Ou-H7ArEaX7QXhjc8ifOmBftibrTInQK7nMhoK-tTW5lmnr1-APDTZ9iRhBlmHxIuOJ5GvCrIw`,
    imageAlt:
      "Serene medium close-up of Elena, 28, a documentary film producer living in Madrid, Spain.",
    languages: [
      { code: "ES", level: "native" },
      { code: "EN", level: "fluent" },
    ],
    interests: ["documentary", "culinaryArts", "ceramics"],
    state: "none",
  },
];

export const REGION_FILTERS = ["all", "spain", "mexico", "colombia", "unitedStates"] as const;
export type RegionFilter = (typeof REGION_FILTERS)[number];
