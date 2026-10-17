const CDN = "https://lh3.googleusercontent.com/aida-public/";

export type PostAuthorId = "sofia" | "mateo" | "elena";

export type PostTime = { kind: "hoursAgo"; value: number } | { kind: "yesterday" };

export type Post = {
  id: PostAuthorId;
  author: string;
  /** Inline text badge shown beside the name (e.g. "CDMX"). */
  roleText?: string;
  location: string;
  /** Where the post was filed from; drives its pin on the posts map. */
  coords: { lat: number; lng: number };
  time: PostTime;
  avatar: string;
  avatarAlt: string;
  image: string;
  imageAlt: string;
  badgeIcon: string;
  likes: number;
  notes: number;
  state: "connect" | "connected";
  hasComment: boolean;
};

export const POSTS: Post[] = [
  {
    id: "sofia",
    author: "Sofia Martinez",
    location: "Barcelona, Spain",
    coords: { lat: 41.39, lng: 2.17 },
    time: { kind: "hoursAgo", value: 2 },
    avatar: `${CDN}AB6AXuBXTn0THA4HVMeGABbs8wWwBCx2WjYfMbZpMDVXOSIcx9p2HQMpHnA5WkIkfN4DMN5XNYwJe-cnEV6FfOnqfP2SVoTocMYb9zibNwP85pNRW89c7DIWpZsZOONw0u5UGlPFVzpMCypE9ENwvtLboWZNX4HNMSHD5d5-vE51LZ0FcBCXUxb3yg_JskNNiQDc-_BvaSTm4JChDR8iDeVNYN04QBJW6xhaE0cMseP1bLdmt_2E_syklbGIvw`,
    avatarAlt: "Sofia Martinez portrait",
    image: `${CDN}AB6AXuDHZIQKVSIaalUNnJYko60nRMZC5DSQL9WW9W05f35dn5TFjkpTUKnDljs1LSS37AaEYU1-rwg8yZx43AteHcbwJOEQIJU9ngINazOmzeJ8d4OThCWHvg-ekKfQLNJTe3ThoclDSFc8cQubEUAqA2rOi6fKI_-2ZjonddhfirSDECtuRxRlLfaXuyOs6c-hdZb2xNJu_5vg583N_S4MvDM1ty7uSizYIvzehKpUkmuS0P5UHKXsHAn4Iw`,
    imageAlt:
      "Editorial warm daylight analog 35mm photograph of a cafe terrace in the Gothic Quarter, El Born, Barcelona.",
    badgeIcon: "photo_camera",
    likes: 42,
    notes: 6,
    state: "connect",
    hasComment: true,
  },
  {
    id: "mateo",
    author: "Mateo Delgado",
    roleText: "CDMX",
    location: "Coyoacán, Mexico City",
    coords: { lat: 19.35, lng: -99.16 },
    time: { kind: "hoursAgo", value: 5 },
    avatar: `${CDN}AB6AXuCvlas-jIu17DKUJNG8fIh528AfhwyUZqZmuEyue8BcXQqlFgubygsf97f1ThWMH5zA2jaBW7oHKyydrlypWaY3N0WM69mA6N3d5nkGXATE2n98RC-Oipq26jVaQSsIFhz8YU7zeD4VwKBkHii55xImc8lirnjhOEg-u4gDg7EG-CBemsONI0cSVXQGTNxHBqGRhJ73-YnnCmE5oiclV05d43hK6oWaLzpSHVzrxpfXIaksecx-Bh_r5Q`,
    avatarAlt: "Editorial close portrait of Mateo Delgado.",
    image: `${CDN}AB6AXuC_0Tcq1epxwpxKjlSJWkSxRD-Gm0mP6j1cfruo34UbY6MJpab8YiEx1FT94pYtCYfUlVL0ILuLKlt9OCS5h2ly6LPGdY1p6v1t5Ixt9CePwuGDiwkpVfYCa9IyB236ghLZuDWBeXWrPXIjM2Y_8Cn3cZUMVTkAv_zO2M3sfmyEejyrzDLHCVIO3w7GmG0cS1D2hQryQ9LVd806jf7EPKxKYwplNCRTlSXD48_cqK9pWGuQg22LbcIsaw`,
    imageAlt:
      "Editorial street photography of a cobblestone avenue in Coyoacán, Mexico City, with jacaranda trees.",
    badgeIcon: "nature",
    likes: 58,
    notes: 11,
    state: "connected",
    hasComment: true,
  },
  {
    id: "elena",
    author: "Elena Vance",
    location: "Madrid, Spain",
    coords: { lat: 40.42, lng: -3.7 },
    time: { kind: "yesterday" },
    avatar: `${CDN}AB6AXuCNSydODYoo_WqZzZtxK7s_NJ6bcjgidDQky4-mL6ln0IR8ECaLD4Br4c4dvQS-ZEI52bH406IMy1kh08swQ4cHy9AGHehnJqsjMIWKubcjh-eV0JetwQTQcFSRAr1XzavD75ZWlnomEZz9prfWTgYpnp_SnK3uColUQzGaaR5MoKY_rqkiYEkLcYMbztflLDJblf3Y6sEQt_GpGCxU4fZsarULTLr9SSWjloqZG_JvHspc9UnnjIYTYA`,
    avatarAlt: "Modern close-up portrait of Elena Vance.",
    image: `${CDN}AB6AXuBxX6gGbn3i8sqDZ9Q_AUFZMxUrzsLZP9nsRYYNHTinaeU8hEperwRY6K6-9w5K8gVafWNG_cZUYdfoO2gIAL0EIjOcIO571HKqWBVBxW2HbU9Ytjz_amd-SctKVy6V7TJjc5m7i54y5Sg9jY1AOayv7-IruPxkDGKqUW8CkRvli5la5wMI6tYI3rx9BNqiPvJFhGGwySlCPpsRyKVoVC59DlTdoAH9g06ocM8wtYUv6JBH-AG9fo0xhg`,
    imageAlt: "Editorial gallery photograph inside a contemporary art exhibition in Madrid.",
    badgeIcon: "palette",
    likes: 31,
    notes: 4,
    state: "connect",
    hasComment: false,
  },
];

export const POST_FILTERS = ["all", "connectionsOnly", "spainLatam"] as const;
export type PostFilter = (typeof POST_FILTERS)[number];
