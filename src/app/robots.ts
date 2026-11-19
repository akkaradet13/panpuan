import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/profile", "/login"] },
    sitemap: "https://panpuan.net/sitemap.xml",
  };
}
