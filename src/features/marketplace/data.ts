const CDN = "https://lh3.googleusercontent.com/aida-public/";

export type MarketplaceCategory =
  "artisanCrafts" | "homeLiving" | "booksCulture" | "localGoods" | "travelGear";

export type MarketplaceBadge =
  "artisanPartner" | "adminCurated" | "globalLinkupOriginal" | "adminVerified" | "directTrade";

export type FulfillmentKey = "fulfillmentCourier" | "fulfillmentPostal";

export type ProductSpecs = {
  origin: string;
  artisan: string;
  material: string;
  dimensions: string;
  weight: string;
  fulfillment: FulfillmentKey;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  /** Short origin chip shown on the card, e.g. "Oaxaca, MX". */
  originLabel: string;
  category: MarketplaceCategory;
  badge: MarketplaceBadge;
  price: number;
  /** Short copy for the grid card. */
  summary: string;
  /** Longer copy shown in the detail drawer. */
  description: string;
  specs: ProductSpecs;
  image: string;
  imageAlt: string;
  /** Detail-drawer gallery. A single entry renders no thumbnail switcher. */
  gallery: string[];
  galleryAlts: string[];
};

/**
 * Marketplace catalog. Product names, descriptions and provenance are
 * admin-authored catalog content, so they intentionally live here rather than
 * in the translation catalogs (see `docs/CONTEXT.md` conventions).
 */
export const PRODUCTS: Product[] = [
  {
    id: "p1",
    sku: "GL-OAX-882",
    name: "Handmade Oaxacan Leather Travel Bag",
    originLabel: "Oaxaca, MX",
    category: "artisanCrafts",
    badge: "artisanPartner",
    price: 120,
    summary:
      "Full-grain vegetable-tanned bovine leather created by master leathercrafter Mateo Velásquez in Santo Domingo Tomaltepec.",
    description:
      "Constructed with 100% genuine full-grain vegetable-tanned leather that patinas richly over time. Crafted in collaboration with the Velásquez artisan guild in Oaxaca, Mexico.",
    specs: {
      origin: "Oaxaca, Mexico",
      artisan: "Mateo Velásquez Guild",
      material: "100% Full-grain bovine",
      dimensions: "52cm x 28cm x 25cm (Carry-on)",
      weight: "1.45 kg / 3.2 lbs",
      fulfillment: "fulfillmentCourier",
    },
    image: `${CDN}AB6AXuDLI6XLgZB2ElXb8t8VMIccnjQTxJj7m29dOztb5waExkRl4L6bwsQL9HR34XDjyffZO1-jFDo3d8Fve4030pI0WBIiEUK1F-2pQjb5tiwb1JxXiWiPCHRWobP_u89uIMfzrlb5udW7Pm84sDWv4Tnq5jzIFN13duJ6RNyAoCR3H_T3ZHsI94dpJHAX_trERqofTVhqA3DHyrmz_cmN_I-I2Qe8IRvFnze7z2G72XX2lhqmha7mr1ACLQ`,
    imageAlt:
      "Rich cognac-colored hand-stitched artisan leather duffel bag on a terracotta patio in Oaxaca, Mexico.",
    gallery: [
      `${CDN}AB6AXuBhOd6K8RbfqYHSVbvKFg4NDBq891TOr09qKiRS2gfcorAcqivCji2XR86JpCCoD36bCbV1H-8Xtph_l4PQ-DSJ2CkNiSMwpPjK3at-IoYIVuw2MXDq-3_9PBzID0ym_XaJEJUKpWPk4wAvHRqDK8ZuhTBg5SQN0IcC-1d7ag44g2xkpbkbHKtqs-wfIE62YUhBU7Em6xUNMcaggK1885-klCI3gH6r9bc6F5MQ3Ch4jCGjvHZLI6DQ9g`,
      `${CDN}AB6AXuBwUrF9qr4Ok3pf-KYMVN8-5Ro9qMtLdAMT7IekggXaX_JrDBaSL4aM9veue0EsnfXtCbzPB_Chh5OhV3mfaml0cobuyzit1iEltgEBrY3GCGlcguCiF7D-0548NC9ZJxe5wrljBTb69h0MdJF0xrZPM7O0gcAZpGtE-8zxkBw7-81lreH9_FPHy968dilSyU_eLM70BaEmT7HnYqele698EQG9v2CFHlsFmDDXJoQCSpIDFu1MesB70w`,
      `${CDN}AB6AXuBq5wO7gd5gC9jbUYKDsQ-NE3fVJ3xsGR5dEVlm5or2PHLcl9TgungEspRy3R8D8WPsQQHJeT7vrtaKemHfPK5tU7_u988lf9iGCX85WPiWAyP_60oXuTNQnWTby6wK3PQX_BqCTUyS7GAXbQnowTR3t1RzCrOHcZ_3l8BafZtP0_2ZZBfySBKWaAJ4rqMdJS7aT8D-ec1goeknn2kMs0yVSEdcWg4KZpZCeKguSWLlQID9sTacrYy0tA`,
      `${CDN}AB6AXuD8fPQm1QbjmWeDWDKkNIR2XrzHweApijqOu03agan7RwzWAbsWEwa_wG2RQJDB6Ygmfpw7IopbIoIPvLx1-mq1hDdjkHLEqNB_uwjk3I5J4aEMfInoWzyVTl92MvCznilIskRZsX_N_IOs3aYAIjfBjScQzP-9QV0D8jdBMiwTuEsaG4m2FTmP2RdE3P6CZ_oUxJFp-qI6kJYvlMS9BLpFyKGnrd7HLy41AdGZVtAtfIBZ3aOgPUgtYQ`,
    ],
    galleryAlts: [
      "High resolution studio photography of the handmade cognac leather travel bag.",
      "Close-up detail of brass buckle and heavy stitching on the artisan leather bag.",
      "Interior lining of the leather travel bag with hand-loomed Mexican cotton.",
      "Artisan Mateo Velásquez tooling the leather strap inside his Oaxaca workshop.",
    ],
  },
  {
    id: "p2",
    sku: "GL-BCN-410",
    name: "Artisanal Ceramic Espresso Set (Barcelona)",
    originLabel: "Barcelona, ES",
    category: "homeLiving",
    badge: "adminCurated",
    price: 64,
    summary:
      "Pair of matte-glazed terracotta espresso cups fired in Gràcia. Ergonomic thumb rest and dual thermal heat retention.",
    description:
      "Hand-thrown and matte-glazed in a family atelier in the Gràcia district. Each pair is fired twice for a speckled stoneware finish that keeps espresso hot without burning the rim.",
    specs: {
      origin: "Barcelona, Spain",
      artisan: "Taller Gràcia Ceramics",
      material: "Speckled stoneware, matte glaze",
      dimensions: "6cm x 6cm x 7cm per cup (Set of 2)",
      weight: "0.62 kg / 1.4 lbs",
      fulfillment: "fulfillmentCourier",
    },
    image: `${CDN}AB6AXuA0tW71P3YliN4ZbSTV92yko_Up1TD9LmdTs8njC0DgAFyE-TX4OcpcmJg4gIAqnkpn58fPAeaB-RXNedUj7psYhbkAr4UAn2u_xLe9evPV_TwvM_KjMPaUSYNJfxF6sGryk06OG480NRkgyZ6oyk4UkvnwybpIHvXXHHuXycuyIQbdVSTUuRqwfvInWqmNaGFJIeoJtPR9b63YktEikMugRIwABkpEuecIpXuG7Uhj6m1PpZPO_eTphQ`,
    imageAlt:
      "Minimalist handcrafted ceramic espresso cups and saucer set with speckled stoneware glaze.",
    gallery: [
      `${CDN}AB6AXuA0tW71P3YliN4ZbSTV92yko_Up1TD9LmdTs8njC0DgAFyE-TX4OcpcmJg4gIAqnkpn58fPAeaB-RXNedUj7psYhbkAr4UAn2u_xLe9evPV_TwvM_KjMPaUSYNJfxF6sGryk06OG480NRkgyZ6oyk4UkvnwybpIHvXXHHuXycuyIQbdVSTUuRqwfvInWqmNaGFJIeoJtPR9b63YktEikMugRIwABkpEuecIpXuG7Uhj6m1PpZPO_eTphQ`,
    ],
    galleryAlts: [
      "Minimalist handcrafted ceramic espresso cups and saucer set with speckled stoneware glaze.",
    ],
  },
  {
    id: "p3",
    sku: "GL-EDT-024",
    name: "Bilingual Cultural Phrasebook & Journal (EN/ES)",
    originLabel: "Official Edition",
    category: "booksCulture",
    badge: "globalLinkupOriginal",
    price: 24,
    summary:
      "Curated by linguistic anthropologists. Includes regional idioms, conversation prompts, and dot-grid archival paper.",
    description:
      "The official GlobalLinkup journal: linen-bound, foil-stamped, and paired with a copper pen. Built for travellers who want to record a place rather than just photograph it.",
    specs: {
      origin: "Madrid, Spain",
      artisan: "GlobalLinkup Editorial Studio",
      material: "Linen-bound, archival 120gsm paper",
      dimensions: "21cm x 14.8cm x 2.1cm (A5)",
      weight: "0.48 kg / 1.1 lbs",
      fulfillment: "fulfillmentPostal",
    },
    image: `${CDN}AB6AXuD0NAAt1oPnXW44sv5ss9z3bEh4XcLXNUpw1SveU9Rcm2orgNJe917j8z4hMEqYuxtCd0iTIKonejsSybmOr-6v1iZheebms5UcTYAxoNneiXJMJNXg_qs3KutQmO_UTjUPTBsViNiM0FpfsiKBaImPCMXtsrIoT0kmAvXB1zUaKm1YUyvWRVqesXhJ6kfHK9M7xHrI__a-z2Ta9J27mdVMneGHIGLWPw2Nxr8guWB0Ww24o4W7aCHfnA`,
    imageAlt:
      "Premium linen-bound bilingual notebook and cultural phrasebook with gold foil typography.",
    gallery: [
      `${CDN}AB6AXuD0NAAt1oPnXW44sv5ss9z3bEh4XcLXNUpw1SveU9Rcm2orgNJe917j8z4hMEqYuxtCd0iTIKonejsSybmOr-6v1iZheebms5UcTYAxoNneiXJMJNXg_qs3KutQmO_UTjUPTBsViNiM0FpfsiKBaImPCMXtsrIoT0kmAvXB1zUaKm1YUyvWRVqesXhJ6kfHK9M7xHrI__a-z2Ta9J27mdVMneGHIGLWPw2Nxr8guWB0Ww24o4W7aCHfnA`,
    ],
    galleryAlts: [
      "Premium linen-bound bilingual notebook and cultural phrasebook with gold foil typography.",
    ],
  },
  {
    id: "p4",
    sku: "GL-MDE-330",
    name: "Handwoven Merino Wool Travel Throw",
    originLabel: "Medellín, CO",
    category: "artisanCrafts",
    badge: "adminVerified",
    price: 88,
    summary:
      "Ultra-soft lightweight merino wool loomed in the Antioquian highlands. Compact rollable form factor for long flights.",
    description:
      "Woven on traditional wooden looms in the Antioquian highlands with an understated Andean geometric pattern. Warm enough for a cold cabin, light enough to roll into a day bag.",
    specs: {
      origin: "Medellín, Colombia",
      artisan: "Tejedoras de Antioquia",
      material: "100% extra-fine merino wool",
      dimensions: "180cm x 130cm (Rolled: 30cm)",
      weight: "0.85 kg / 1.9 lbs",
      fulfillment: "fulfillmentCourier",
    },
    image: `${CDN}AB6AXuAZQ4boA-2Bb0qo-iEZ2HE7wJJShUnB3_5rbpKb_sET3d28MjLfe0BQmVHMXj-ryQGp7NQ8JGLxFEhnl9Fa535s20APTkTsjhguMQQj3ehCMItqdRHH2SJ-NJaUTieBAK7bsnvcigKq0hyuOZJaRExwNVdZkYUMI7w9N91GyuEwsIojX6ufzn1U_pWfqxYhfvIB9B2S3dmjDbh7w1yPyJxkRPS1M6xRKwwjBUsg8qPOEPuRan7JlGEjtQ`,
    imageAlt:
      "Folded high-end merino wool travel blanket throw with an understated geometric Andean pattern.",
    gallery: [
      `${CDN}AB6AXuAZQ4boA-2Bb0qo-iEZ2HE7wJJShUnB3_5rbpKb_sET3d28MjLfe0BQmVHMXj-ryQGp7NQ8JGLxFEhnl9Fa535s20APTkTsjhguMQQj3ehCMItqdRHH2SJ-NJaUTieBAK7bsnvcigKq0hyuOZJaRExwNVdZkYUMI7w9N91GyuEwsIojX6ufzn1U_pWfqxYhfvIB9B2S3dmjDbh7w1yPyJxkRPS1M6xRKwwjBUsg8qPOEPuRan7JlGEjtQ`,
    ],
    galleryAlts: [
      "Folded high-end merino wool travel blanket throw with an understated geometric Andean pattern.",
    ],
  },
  {
    id: "p5",
    sku: "GL-CHP-500",
    name: "Specialty Roasted Chiapas Coffee Beans (500g)",
    originLabel: "Chiapas, MX",
    category: "localGoods",
    badge: "directTrade",
    price: 19,
    summary:
      "Single-origin high altitude Typica and Bourbon varietals with tasting notes of raw cacao nibs, dried fig, and orange blossom.",
    description:
      "Grown at 1,600m by a smallholder collective and roasted in small weekly batches. Direct-trade pricing is paid to the growers with no intermediary margins.",
    specs: {
      origin: "Chiapas, Mexico",
      artisan: "Finca La Esperanza Collective",
      material: "Single-origin Typica & Bourbon",
      dimensions: "500g valve-sealed kraft bag",
      weight: "0.52 kg / 1.15 lbs",
      fulfillment: "fulfillmentCourier",
    },
    image: `${CDN}AB6AXuAXSGA7fZFDnOETp0Yc5I1TSPe4iIn0P-FM1zPym6k1CGjz4uysjYbsbxWVNOlfsCs9eY3MOkuTXaw9QUborPeAxtZTau4WYUz1kjS05m0VgkP09bZOsg9XywEYxa5PFt6UCXMMbHXKWNl-S47Z0z04z4Ttg9-Zdgy04hjngwh4tZc7hgSlZcTazGT-a7rT9INdHrKp0hnmIcIT_WQsk8g3XcWkxq1VvEM36DCe8fOGv_Rs9Vna_DiVQw`,
    imageAlt:
      "Matte kraft paper coffee packaging bag labeled Specialty Roasted Chiapas Shade Grown Whole Bean Coffee.",
    gallery: [
      `${CDN}AB6AXuAXSGA7fZFDnOETp0Yc5I1TSPe4iIn0P-FM1zPym6k1CGjz4uysjYbsbxWVNOlfsCs9eY3MOkuTXaw9QUborPeAxtZTau4WYUz1kjS05m0VgkP09bZOsg9XywEYxa5PFt6UCXMMbHXKWNl-S47Z0z04z4Ttg9-Zdgy04hjngwh4tZc7hgSlZcTazGT-a7rT9INdHrKp0hnmIcIT_WQsk8g3XcWkxq1VvEM36DCe8fOGv_Rs9Vna_DiVQw`,
    ],
    galleryAlts: [
      "Matte kraft paper coffee packaging bag labeled Specialty Roasted Chiapas Shade Grown Whole Bean Coffee.",
    ],
  },
  {
    id: "p6",
    sku: "GL-MAD-118",
    name: "Minimalist Passport & Document Wallet",
    originLabel: "Madrid, ES",
    category: "travelGear",
    badge: "adminCurated",
    price: 45,
    summary:
      "RFID-blocking micro-compartments tailored for dual-citizenship passports, SIM tray ejector needle, and folded itinerary cards.",
    description:
      "Cut from a single panel of vegetable-tanned leather and stitched in Madrid. Built for travellers who carry two passports and want them protected without a bulky organizer.",
    specs: {
      origin: "Madrid, Spain",
      artisan: "Taller Piel Madrid",
      material: "Full-grain leather, RFID shielding",
      dimensions: "14cm x 10cm x 1.8cm",
      weight: "0.18 kg / 0.4 lbs",
      fulfillment: "fulfillmentPostal",
    },
    image: `${CDN}AB6AXuASUHdpSQblAjeGOT3OwNef9NyFHzxmHFUY7wWFELhcnR1VouycKaT0LlJvE6HKgBtXMVOYYuNgxJ-MLT_Z6TAkalNt1XAWpMgihPV2L38600fIl0UYmh-UxWIc3kRwKBS003Lzw9nIoNWmpIWkOFgmL2BzKlEy3QR1LAO9qz8cNlkX2KP3CPFcriQTI_LL8VRlDyLgLeEA52cJCRJOkM9Me5HBZJZ1s3_JkvNbmf25pf7Y5mGlCL9Vxw`,
    imageAlt:
      "Slim minimal dark olive green leather passport wallet with boarding pass and pen tucked inside.",
    gallery: [
      `${CDN}AB6AXuASUHdpSQblAjeGOT3OwNef9NyFHzxmHFUY7wWFELhcnR1VouycKaT0LlJvE6HKgBtXMVOYYuNgxJ-MLT_Z6TAkalNt1XAWpMgihPV2L38600fIl0UYmh-UxWIc3kRwKBS003Lzw9nIoNWmpIWkOFgmL2BzKlEy3QR1LAO9qz8cNlkX2KP3CPFcriQTI_LL8VRlDyLgLeEA52cJCRJOkM9Me5HBZJZ1s3_JkvNbmf25pf7Y5mGlCL9Vxw`,
    ],
    galleryAlts: [
      "Slim minimal dark olive green leather passport wallet with boarding pass and pen tucked inside.",
    ],
  },
];

/** Filter pills shown above the grid (mirrors the reference design). */
export const MARKETPLACE_FILTERS = [
  "all",
  "artisanCrafts",
  "travelGear",
  "booksCulture",
  "localGoods",
] as const;
export type MarketplaceFilter = (typeof MARKETPLACE_FILTERS)[number];

export const MARKETPLACE_CONTACT = {
  whatsappNumber: "+34 612 345 678",
  whatsappLink: "https://wa.me/34612345678",
  email: "concierge@globallinkup.com",
} as const;
