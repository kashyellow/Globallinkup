const CDN = "https://lh3.googleusercontent.com/aida-public/";

export type LanguageLevel =
  "native" | "fluent" | "advanced" | "conversational" | "proficient" | "basic";

export type PersonaLanguage = {
  code: string;
  level: LanguageLevel;
};

export type ConnectState = "none" | "requested" | "connected";

export type Persona = {
  id: string;
  name: string;
  age: number;
  location: string;
  image: string;
  imageAlt: string;
  languages: PersonaLanguage[];
  /** Interest keys resolved against `Discover.interests.*`. */
  interests: string[];
  state: ConnectState;
  badge?: "previewed" | "directContact";
};

/** Demo discovery results (see Reference/discover.html). */
export const PERSONAS: Persona[] = [
  {
    id: "sofia",
    name: "Sofia Martinez",
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

export const DOSSIER = {
  name: "Sofia Martinez",
  banner: `${CDN}AB6AXuAgDqim47BKGj6qV9SKJ_AW5MT1GJwUeDgI4uY5ZwGlczQJWb_zJD_K08V9DI12hF2m9JZXlpJoScV3dmUoBACzO0T9tYtr2F5PNSw9f2EdFKgxXLSt46NmsbYFZYECAoFmtDCLzAKapowqrsUGbzaB2XaiFdIDJen6xTvhb-4Sz1ExJhqB-RRlgate3hVfH8sHRUgDW6KTr4I3xb0Vnatb73Su_oicLr-WWfH4m062XTc5r7iXNYf6_w`,
  bannerAlt:
    "Cinematic lifestyle photo of Sofia Martinez on a sun-drenched rooftop terrace in Barcelona.",
  gallery: [
    `${CDN}AB6AXuBKvcn5jJwWjcTXgp4owYH5J_S6GvcEdcaNJIepVikJbNirVxtCTC8w7wu5KO0sbdhi4BeyRF87t2Msl2U6xt0pfcmd4FrIt572BV3Qwgx4JDalrZowMEVZzwnjYHSh8EIQbfaa7ySUvgrt17Wo2KWxJ_b-i85T0MdwUdV0p_0hMD5SlDMs8vx5niqXzvGv6XIoUFtfgMQ3JOczwucRG5Adpj0Y716t4ZMl8g52ZwXo0EVI18bLz5Bk4A`,
    `${CDN}AB6AXuAl395c3XDE4rZ1CpOChR57RYKSR-uDQPeDopqyQWmL4D6BGU2tbSEt86Qm2Ky1RV-KZDy3GSNSUsh28-RRbAO7kJ1MHkClFyrE54wDiCcRoRqcZhu892c5eOEen3_W1SQ6PQrI7-wbZIvWun0jNaCvyVeW5VtaXT1fn3Rpr83E5z2uZMRJvFHLBnletvRYdV5YR1SLpWAzpE_9Y7TM-jx8PU9N0AbHs36h9li3hG5FYwr745BhfmZlyg`,
    `${CDN}AB6AXuBGi3r8ZM4gahXg01ykLh_drJmB382S4EmjtZi0itnRetmXl-G7WrRITwH9OIe9RrXGPvTILcEPYy7oAA6qc8wL4Dq-yEp6paWg4WpBSAwNtz4UI4aP8kGqLdyk6J0mqODAd0ppkwo6qfDX0k5Ji1wp4rwNGqA5d8m-fkgXnETWUx6YE3oxAWrbqvVUxU-vAZQ6H0RevBbfhUJBhn7Jmy5nwt_EH9nSyFCqBQpRmy3h4-bDj7LbqdgFXw`,
    `${CDN}AB6AXuCxBJc-7rXTFSCTxXZ-YoG8ckC_zANM7KgHg-Hz443wiJGDYurLp3Q1WI72xEgrBHeSTTAmFXRrxETyjknMrftrjhlKE8b1nPo-tkc4THo2obu17Tz2eljmUViw39emXvRQX-veiNGwuQX2c1Mfp3_5NuC4ZJOdeZz_W4LuOvOVOMmahRnvshGjEvBEf77q7nIdqqPrqb27Z_eUPrgmLAa4NJs_1xIcB8ggsC1sa6ax-JIzpXFB12GjYg`,
  ],
  galleryAlts: [
    "Detail shot of modern Catalan architecture in Barcelona.",
    "Close up of a traditional ceramic coffee cup on an outdoor marble table in Gracia, Barcelona.",
    "Sofia holding a vintage film camera at an outdoor art exhibition in Barcelona.",
    "Sunset aerial view of the Barcelona coastline.",
  ],
  contact: {
    instagram: "@sofia.mtz_bcn",
    whatsapp: "+34 612 849 201",
    email: "sofia@bcncreative.es",
  },
} as const;

export type InboundRequest = {
  id: string;
  nameKey: "daniel" | "valentina";
  avatar: string;
  avatarAlt: string;
};

export const INBOUND_REQUESTS: InboundRequest[] = [
  {
    id: "daniel",
    nameKey: "daniel",
    avatar: `${CDN}AB6AXuD4oZOjTxiZ5BKt2Rf6TT6Qdle3Xqvl9DRxG_3SOe4_5bUKnOwBMjxLvcNQBoyp5ZrSSNyjgbSuqHCU8E0zJh66aS0hCBRicUwWJfP07mOaSPK0ECgzWuNcpQQanh-m_h2HW1bA62qCssruNWD1pUHOEDnDTyF1EovWzUztmyUCRnAKGpYjbpcBxoO0xAzYdKzJWBWOvzFsusjVWfHHPEpFwGdL3__BnwhTj2J9ExlyOcATtCBsjd-a2A`,
    avatarAlt: "Close portrait of Daniel Rivera, a 30-year-old architect from Mexico City.",
  },
  {
    id: "valentina",
    nameKey: "valentina",
    avatar: `${CDN}AB6AXuC8zs6MWjEIYsHWOJ9mQc-_BjzEAmhwVEiakrhzd1hVsaUEWJi8yxEV8ZjUgrGUKdST6vL7a6HWIXy3e0bbeSl9a2OIavIkdkckXKKtyIYKmINEHIyL2YtcCS7dwFYvBIIwGVY8wcsl8t3URO5l1JjLJtJWbkYgqUJaalFPbWF-MOSCsV2tZD4jsV-lVZxuIsXArepMOBg7_HCXgAqjCCUw8_2xdmpSD5sZ_8TArEkFvfx-uzAAucK9Mw`,
    avatarAlt: "Close warm portrait of Valentina Gomez, 26, from Bogotá, Colombia.",
  },
];

export const REGION_FILTERS = ["all", "spain", "mexico", "colombia", "unitedStates"] as const;
export type RegionFilter = (typeof REGION_FILTERS)[number];
