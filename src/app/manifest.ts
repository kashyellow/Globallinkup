import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GlobalLinkup",
    short_name: "GlobalLinkup",
    description: "Bilingual people discovery, posts, connections and a curated marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e6",
    theme_color: "#253c36",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
