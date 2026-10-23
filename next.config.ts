import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The plugin defaults to `./src/i18n/request.ts`; point it at the real location
// (`src/lib/i18n/`, per PRD §9.1) now that the i18n module lives under `lib/`.
const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  experimental: {
    // Image uploads go through a Server Action; the default 1 MB cap is below
    // the 10 MB bucket limit. Keep headroom for multipart overhead.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default withNextIntl(nextConfig);
