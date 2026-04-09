import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/metadata/site";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl().replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
