/**
 * Own-profile ("Member Dossier") mock data, ported from `Reference/profilepage.html`.
 *
 * The image URLs below are injected programmatically from the reference file — never
 * copy/paste them by hand. Long `lh3.googleusercontent.com` URLs were previously
 * truncated by a single character during a manual copy and silently returned HTTP 400.
 *
 * User-authored content (name, bio, dispatch prose, series titles, cities) intentionally
 * stays in English/Spanish here and is NOT translated; only UI chrome goes through i18n.
 */

import { PRODUCTS } from "@/features/marketplace/data";

export const PROFILE_IDENTITY = {
  dossierId: "GL-BCN-84920",
  name: "Sofia Martínez",
  age: 27,
  role: "Architect & Cultural Documentary Filmmaker",
  location: "Barcelona, Spain",
  languages: "ES (Native) • EN (Fluent)",
  tier: "Diaspora Network Pro",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAATlSmkEIUqeeL2L5XxBOU6w03gzVzBw2Uzhhca7DwdYW4hDZd4o2AHMBhf1TzL67D6LizWd-FlfVA5rzm36kc_qs9lanO29UHXGB-OSFZtqfLJCv-9QAADdrJu-b1MpnO7Bk7BE5yKrjUuUxCafSczIqtPSB73rF_OXuT5UwFZcwTK2wqBodkDNA66r01n5t9K7H5kFx9Lg8ZtrZYW1pwWrb9focCtsu1qILGbUffIAcWXP7LwBQmuw",
  avatarAlt: "Sofia Martínez headshot",
} as const;

/** Consent trust score rendered in the radial gauge (0–100). */
export const TRUST_SCORE = 100;

export const PROFILE_METRICS = [
  { id: "connections", value: "48", accent: false },
  { id: "dispatches", value: "14", accent: false },
  { id: "saved", value: "6", accent: false },
  { id: "unlockRate", value: "100%", accent: true },
] as const;

/** Bilingual bio — both editions are shown side by side in the dossier. */
export const PROFILE_BIO = {
  en: "Curious about brutalist restoration, sunlit terraces, and analog film walks through the Gothic Quarter. Seeking genuine cultural exchanges and design dialogue.",
  es: "Fascinada por la restauración brutalista, terrazas bañadas de sol y paseos con película analógica por el Gòtic. Buscando intercambios culturales honestos y diálogo arquitectónico.",
} as const;

export const CULTURAL_TAGS = [
  "architecture",
  "analogPhotography",
  "ceramics",
  "espressoCulture",
  "urbanism",
] as const;
export type CulturalTag = (typeof CULTURAL_TAGS)[number];

export type HandleStatus = "shielded" | "open";

export type LockerHandle = {
  id: "whatsapp" | "instagram" | "substack";
  icon: string;
  /** Masked value as stored; omitted for handles that are openly published. */
  value?: string;
  status: HandleStatus;
};

export const LOCKER_HANDLES: LockerHandle[] = [
  { id: "whatsapp", icon: "chat", value: "+34 6•• ••• 419", status: "shielded" },
  { id: "instagram", icon: "photo_camera", value: "@sofia••••••••", status: "shielded" },
  { id: "substack", icon: "article", status: "open" },
];

export type ProtocolRuleId = "inquiries" | "bilingualNote" | "incognito";

export const PROTOCOL_RULES: { id: ProtocolRuleId; defaultOn: boolean }[] = [
  { id: "inquiries", defaultOn: true },
  { id: "bilingualNote", defaultOn: true },
  { id: "incognito", defaultOn: false },
];

export type CircleMember = {
  id: string;
  initials: string;
  name: string;
  city: string;
  /** true once contact channels have been mutually unveiled. */
  unveiled: boolean;
  unlockedDaysAgo?: number;
};

export const CIRCLE_MEMBERS: CircleMember[] = [
  {
    id: "mateo",
    initials: "MS",
    name: "Mateo Silva",
    city: "Bogotá",
    unveiled: true,
    unlockedDaysAgo: 4,
  },
  {
    id: "camila",
    initials: "CO",
    name: "Camila Osorio",
    city: "Mexico City",
    unveiled: true,
    unlockedDaysAgo: 14,
  },
  {
    id: "lucas",
    initials: "LV",
    name: "Lucas Varela",
    city: "London",
    unveiled: true,
    unlockedDaysAgo: 30,
  },
  { id: "ines", initials: "IB", name: "Inés Barreto", city: "Valencia", unveiled: false },
  { id: "tomas", initials: "TR", name: "Tomás Rivas", city: "Buenos Aires", unveiled: false },
  { id: "nora", initials: "NH", name: "Nora Haddad", city: "Lisbon", unveiled: false },
];

/** Members whose contact channels the owner has already revealed. */
export const UNVEILED_MEMBERS = CIRCLE_MEMBERS.filter((member) => member.unveiled);

export type DispatchImage = { src: string; alt: string };

export type Dispatch = {
  id: string;
  location: string;
  /** Medium / format label authored by the member (not translated). */
  medium: string;
  /** ISO date — rendered with next-intl so month names localise. */
  date: string;
  body: string;
  images: DispatchImage[];
  series?: string;
  appreciations: number;
  notes: number;
};

export const DISPATCHES: Dispatch[] = [
  {
    id: "el-born",
    location: "El Born, Barcelona",
    medium: "35mm Kodak Portra",
    date: "2025-10-24",
    body: "Studying how the late afternoon Catalan sun cuts through the narrow alleyways of Carrer dels Mirallers. Concrete textures meeting 14th-century archways—a quiet lesson in preserving collective memory through raw form.",
    images: [
      {
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQbZNM-Sl_t5u18dYoUPiowykJKrRgEB5baCCCY2yWaW-vfrToUe-mSVpKI1n9prUyVFCm8mgS-36UERC4SjDLi7Qq4gJfPMaHw88aohBxPDPLCTghcnaKL7vFvrsf9yn0To3k7ri7GhjM9KjFwpMUu1fZ6iLRsTk2GA0Q8f6mYIm1rbGt6Ajc97-77QX1TrPjV6Q1Ethe9LNEZz2Ze13jkISzGQjKWGg__wm0tbgk-w6SJo_s5W0-0Q",
        alt: "Warm sunlight slicing dramatically between rustic historic brick buildings and stone arched doorways in El Born Barcelona, 35mm film aesthetic, warm golden tones, shadows and architectural details, editorial documentary travel magazine style.",
      },
    ],
    series: "Stone & Shadow 04",
    appreciations: 42,
    notes: 11,
  },
  {
    id: "triana",
    location: "Triana, Seville",
    medium: "Artisan Dialogue",
    date: "2025-09-18",
    body: "Spent three mornings observing Maestro Rafael hand-wheel terracotta vessels in Triana. Discussed the shared ceramic vocabularies between southern Spain and Oaxaca. Authentic craftsmanship resists the rush of industrial repetition.",
    images: [
      {
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCx1PcLZsTbaAUURUHHdnSO9BvHJsZltwq9xGQvNh-Oi4Uz6DdQqEFOlkkluW-rNBhywOHRfrY-ChVRQdmHskj0gBT_5bIEiMMGidpqweagnhyznniJnUjCo5F1VxYauLsD9Umb1__1Lq_bZmtHK2dvbIYxwoRNDv9tgiAukP_BycChPKyXXYNE-Qpwe3FaXZGBcxkDrlaQ-sb-D_rpXfcA71BsC72F38oo97_4d6t09bw-qnHQ75WqSg",
        alt: "Traditional artisan ceramic studio in Seville Spain with clay pots, warm terracotta glazes drying on raw wood shelves, soft natural window light, documentary style, authentic tactile craft photography.",
      },
      {
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCzpX5TPCXvnZ5s2j2a0-vzR-Sk5nOWhdvCE1pywRkX-n6lCavy_Ybs1oz4uKzckv-QUjzjaNpmE677N4ePgtt6biIHr44oqd469aF8ERo0qGBkB2Z02XllQZMsg0CdvOWpffupzN7gKap5-6fiLjfgVkgX5Z2PteOgnmCXQfmklvI8G7qyAB5mOs7y3tseLBQI11BZhPej7VsI52TMI3YBIcN4Xs_12qMRwp57OdrTFtznIcBLPczVtQ",
        alt: "Close up of artisan potter hands shaping wet terracotta clay on a traditional foot-powered wheel, detailed clay texture, warm earthy tones, cinematic lighting, editorial cultural magazine aesthetic.",
      },
    ],
    appreciations: 58,
    notes: 19,
  },
  {
    id: "gothic-quarter",
    location: "Barri Gòtic, Barcelona",
    medium: "Film Journal",
    date: "2025-08-30",
    body: "Early morning stillness in Plaça de Sant Felip Neri. Bullet indentations from 1938 preserved alongside quiet café tables. Spaces that carry history without shouting.",
    images: [
      {
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDouZJ4c14uvOZB9-B0QyRbCFp_jbCNzyGn_xYjbY1nBGYC9fwR8drr7NuIbsjmmIL0Vq8hSSEZ0mIURxkzywr9VYeyowXjnvBHGIDDBqfVM3QPKoMshHgDU_dIAk3HYRi03_0uSH-gRc0dVraRrNBHPVF8Vk304Jdq52c8pd8xrKir8Vh06maiqsGPrFR4Hu7SFm_QWwvzFDMScOJl-EesaUEwT5GUzjI1C5yl45TaZJIGPRmdOpL3Cw",
        alt: "Quiet historic courtyard of Placa de Sant Felip Neri in Barcelona early morning, weathered historic stone facade, single quiet stone fountain, atmospheric gentle dawn sunlight, candid 35mm film photography.",
      },
    ],
    appreciations: 37,
    notes: 8,
  },
];

/** "Saved Goods" tab — the first six pieces of the curated marketplace catalog. */
export const SAVED_GOODS = PRODUCTS.slice(0, 6);

export type SecurityEventType = "unveiled" | "revoked" | "declined" | "ruleChanged";

export type SecurityEvent = {
  id: string;
  type: SecurityEventType;
  /** Counterpart name, omitted for account-level events such as rule changes. */
  name?: string;
  daysAgo: number;
};

export const SECURITY_LOG: SecurityEvent[] = [
  { id: "s1", type: "unveiled", name: "Mateo Silva", daysAgo: 4 },
  { id: "s2", type: "revoked", name: "Diego Salas", daysAgo: 11 },
  { id: "s3", type: "unveiled", name: "Camila Osorio", daysAgo: 14 },
  { id: "s4", type: "declined", name: "Ana Ruiz", daysAgo: 22 },
  { id: "s5", type: "ruleChanged", daysAgo: 30 },
];

/** Totals shown on the tab bar (mockup counts; only a subset is rendered). */
export const PROFILE_TOTALS = {
  dispatches: 14,
  saved: 6,
  circles: 48,
} as const;

/**
 * Reference instant used to render relative timestamps ("Unlocked 4 days ago").
 *
 * Captured once at module load rather than inside a component: `Date.now()` during render is
 * impure (`react-hooks/purity`) and would also risk an SSR/client hydration mismatch.
 */
const DEMO_NOW = Date.now();

/** Resolves a `daysAgo` offset against {@link DEMO_NOW}. */
export function daysAgoDate(days: number): Date {
  return new Date(DEMO_NOW - days * 86_400_000);
}

/** The "now" to pass alongside {@link daysAgoDate} so both sides use the same reference. */
export const DEMO_NOW_DATE = new Date(DEMO_NOW);
