/** The residency countries offered by the persona form and discover filter. */
export const PLATFORM_COUNTRIES = ["ES", "MX", "CO", "AR", "US", "CR", "CL", "PE", "PT"] as const;

export type PlatformCountry = (typeof PLATFORM_COUNTRIES)[number];
