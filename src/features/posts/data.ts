/** Feed filters shared by the client toolbar and the server query. */
export const POST_FILTERS = ["all", "connectionsOnly", "spainLatam"] as const;
export type PostFilter = (typeof POST_FILTERS)[number];

/** Countries counted as "Spain & LatAm" in the feed filter. */
export const SPAIN_LATAM_COUNTRIES = ["ES", "PT", "MX", "CO", "AR", "CL", "PE", "CR"] as const;

/** Each load-more batch; the cards are tall, so five fills a viewport. */
export const POSTS_PAGE_SIZE = 5;
