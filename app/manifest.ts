import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ThaiAdvice.com — Tayland rehberi",
    short_name: "ThaiAdvice",
    description:
      "Tayland seyahat rehberi: bölgeler, alt bölgeler, mekanlar ve güncel içerikler.",
    start_url: "/tr",
    scope: "/",
    display: "browser",
    background_color: "#fafafa",
    theme_color: "#18181b",
    lang: "tr",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
