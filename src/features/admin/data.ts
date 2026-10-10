const CDN = "https://lh3.googleusercontent.com/aida-public/";

export const ADMIN_METRICS = {
  pendingProfiles: 14,
  reportedPosts: 3,
  curatedProducts: 18,
  openReports: 2,
} as const;

export type AdminTab = "users" | "marketplace" | "moderation";

export const ADMIN_TABS = ["users", "marketplace", "moderation"] as const;

/** Tab badge counts (mirrors the reference design). */
export const ADMIN_TAB_COUNTS: Record<AdminTab, number> = {
  users: 14,
  marketplace: 18,
  moderation: 5,
};

export type AdminUserStatus = "pending" | "flagged" | "approved";

export type AdminUser = {
  id: string;
  name: string;
  location: string;
  bio: string;
  avatar: string;
  avatarAlt: string;
  status: AdminUserStatus;
  langBadge: string;
  /** Small corner badge over the portrait. */
  chipKey: "flagged" | "approved" | null;
  registeredTime: string | null;
  /** Meta chips under the bio. */
  meta: { key: string; tone: "ok" | "warn" | "neutral" }[];
};

export const ADMIN_USERS: AdminUser[] = [
  {
    id: "sofia",
    name: "Sofía Martínez, 28",
    location: "Barcelona, España",
    bio: "“Arquitecta e ilustradora buscando intercambios culturales, diseño editorial y conversación auténtica.”",
    avatar: `${CDN}AB6AXuBkL7oBskrDD1CMmXWLL9rvSLeevylbR3z2uGVlACiRm3MHoLG1QVjjdTXua7JqQURB96HyNJWKR_mVVKM5m1UqSOUJIXvzGJiFJyhktQTKj2_l84DzHxcPUuVfEJxu-PxoBJslDqWZwGqJGQlZ-eKDl3S1gtmCVda3kvsRlYJkS3nBoxhPb8hxxoSg-htC8dmxTwrpQEfLpmLwzRQy_G0bFB3FqoX1jX0smxFjUGqyv-FTnHfuy78LUQ`,
    avatarAlt: "Portrait of Sofía Martínez from Barcelona.",
    status: "pending",
    langBadge: "ES/EN",
    chipKey: null,
    registeredTime: "3h",
    meta: [
      { key: "phoneVerified", tone: "ok" },
      { key: "photoIntegrity", tone: "ok" },
    ],
  },
  {
    id: "carlos",
    name: "Carlos Mendoza, 34",
    location: "Cali, Colombia",
    bio: "“Músico y gestor cultural. Conectando con viajeros interesados en la herencia rítmica de Latinoamérica.”",
    avatar: `${CDN}AB6AXuBOTTWg9sLFM74aWuDQxpZ_abI8R1Ye288ooTOVdsygBBqA6FVjnEmqbEGDTfuTYpCpff6lrsxh_AcnzCfYZ8rr6yJRRYHCCwtd6dcY8ovKDJVSY1cKvXbUbdfJBUYI0FBhCxbVj-hpliS3s8R3ZIb3haRMyujk5KKhSQUdhtzQlfj738J0zF9YwHB040pKOUJTGTuy1q_iKY1PNRVHKZZUdTAqYLX3iwH3xN3juvALaS2KdnKvRKkj9w`,
    avatarAlt: "Portrait of Carlos Mendoza from Cali, Colombia.",
    status: "flagged",
    langBadge: "ES/EN",
    chipKey: "flagged",
    registeredTime: null,
    meta: [
      { key: "instagramSynced", tone: "ok" },
      { key: "needsClearFace", tone: "warn" },
    ],
  },
  {
    id: "elena",
    name: "Elena Rostova, 31",
    location: "Valencia, España",
    bio: "“Ceramista y traductora literaria. Amante de la gastronomía mediterránea y las librerías independientes.”",
    avatar: `${CDN}AB6AXuDcOH5SjOswueH0TBDqldYwKEe7GYeYtaYvYU1qXqorG3Qs501a0t5VX0EgG8oJlAsEBCVtzptQY7fzl2ZrBaLR8oowOEXE-zbSytpo_td_RUwk-xgSoxQAFflMXGh6HtCszcG_gm11O_snUCjT_uFIbwJ1eMQliEks-KEko0CxZgK2WJWKOXUGgLLniSqQIhPWzGwEmCQDxuFC4sf92S_gdgu7KwKf6Q9Smavrr3W0av_r_dGVRtGXnA`,
    avatarAlt: "Portrait of Elena Rostova from Valencia.",
    status: "approved",
    langBadge: "ES/EN",
    chipKey: "approved",
    registeredTime: null,
    meta: [{ key: "identityConfirmed", tone: "ok" }],
  },
];

export type AdminProductCategory = "artisanCrafts" | "homeLiving" | "textiles" | "travelGear";

export type AdminProduct = {
  id: string;
  name: string;
  origin: string;
  price: string;
  categoryKey: AdminProductCategory;
  status: "live" | "reserved";
  inquiries: number;
  inquiriesMetaKey: "conciergeBookings" | "ordersFulfilled" | "pendingPickup";
  inquiriesMetaCount: number;
  image: string;
  imageAlt: string;
};

export const ADMIN_PRODUCTS: AdminProduct[] = [
  {
    id: "leather-bag",
    name: "Handmade Oaxacan Leather Bag",
    origin: "Oaxaca, Mexico · Workshop De la Cruz",
    price: "$120.00 USD",
    categoryKey: "artisanCrafts",
    status: "live",
    inquiries: 14,
    inquiriesMetaKey: "conciergeBookings",
    inquiriesMetaCount: 3,
    image: `${CDN}AB6AXuD3ax1NslEEBf1nsy87-hqZkYyMmiLtNJI0Z4SjDz_M-k_KB2n4HHsp22JIOQq_xF3udeEfIJp7Fi_v5Q_NXYhBYCIrSltLP2fU0S_EHQLaQdQUkwt4ny5SvHVxGEbXBRce39SaHDgTZYhhyBOltmaUOnGFmUQr_YDXfdTWtiKg7ppywWztc2KlkB7XjjI9TzgZvtp8xdXBaVtBmy88NiWpFPAjbelZsaJIj9rcRaNKVl6NUPRhr--qGA`,
    imageAlt: "Handcrafted Oaxacan brown leather shoulder travel bag.",
  },
  {
    id: "espresso-set",
    name: "Terracotta Espresso Set (4pcs)",
    origin: "Sevilla, Spain · Taller Triana",
    price: "$68.00 USD",
    categoryKey: "homeLiving",
    status: "live",
    inquiries: 22,
    inquiriesMetaKey: "ordersFulfilled",
    inquiriesMetaCount: 7,
    image: `${CDN}AB6AXuB8HQhRD-ja_PCgOrexW_t5jj9GP_WhkOQDCx_2ZKyVSlkI72I0xj-qsuYw9Qxg6gkHXMjGjlYiuDXno0debTsix_zNRzvxpBP4Z06KyCwtIBe1GZLvlSWYNJ52Ohi3BpqK2TFSo9yspjc9ehqxED1ZEwbwNcX3OsysP19ow3PKDG-XANPsyvkLMEZ46zovki5bHvx76LivlhV5hFbAjxZX30oLptB1pQ7F9_XgHewi1yye0676PtdN4w`,
    imageAlt: "Minimalist artisanal ceramic espresso cup set glazed in terracotta.",
  },
  {
    id: "alpaca-scarf",
    name: "Pure Baby Alpaca Throw Scarf",
    origin: "Cusco, Peru · Tejedoras del Valle",
    price: "$145.00 USD",
    categoryKey: "textiles",
    status: "reserved",
    inquiries: 9,
    inquiriesMetaKey: "pendingPickup",
    inquiriesMetaCount: 2,
    image: `${CDN}AB6AXuDcPl5gVswLwFaEyPLg3bKxACNzSlpzkdb0REW1zSwwB2IJhnPaircXdveZmqi6OE_yPcMXeI9_c7yfL0Z_AlO838zX3S3CFzROlKsQQtZFw8KoSQL11LkFK1wHPqVNPGMlWw32da96QlhGIuJGs67sA7q2r0J3X3aJGkqvgZmsvT_bbglucN_lKczXsYAVywxaip-Wpq0j9r-yySPTKbeuQ0q_2_XZ5HBazo0gsmzDbhd8CwGju2IbSw`,
    imageAlt: "Artisanal handwoven natural alpaca wool scarf in warm sand tones.",
  },
];

export const PRODUCT_CATEGORY_KEYS: AdminProductCategory[] = [
  "artisanCrafts",
  "homeLiving",
  "textiles",
  "travelGear",
];

export type Incident = {
  id: "spam" | "impersonation";
  tone: "danger" | "warn";
  badgeKey: string;
  timeKey: string;
  titleKey: string;
  bodyKey: string;
  authorKey: string;
  reporterKey: string;
  actions: ("dismiss" | "removePost" | "askVerification" | "suspend")[];
};

export const INCIDENTS: Incident[] = [
  {
    id: "spam",
    tone: "danger",
    badgeKey: "spamBadge",
    timeKey: "spamTime",
    titleKey: "spamTitle",
    bodyKey: "spamBody",
    authorKey: "spamAuthor",
    reporterKey: "spamReporter",
    actions: ["dismiss", "removePost"],
  },
  {
    id: "impersonation",
    tone: "warn",
    badgeKey: "impersonationBadge",
    timeKey: "impersonationTime",
    titleKey: "impersonationTitle",
    bodyKey: "impersonationBody",
    authorKey: "impersonationAuthor",
    reporterKey: "impersonationReporter",
    actions: ["askVerification", "suspend"],
  },
];
