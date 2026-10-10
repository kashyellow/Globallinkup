import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The plugin defaults to `./src/i18n/request.ts`; point it at the real location
// (`src/lib/i18n/`, per PRD §9.1) now that the i18n module lives under `lib/`.
const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withNextIntl(nextConfig);
