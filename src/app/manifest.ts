import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PanPuan ปั่นป่วน ปั่นจักรยานอุบล",
    short_name: "PanPuan",
    description: "นัดปั่นและเส้นทางปั่นจักรยานในอุบลราชธานี",
    start_url: "/",
    display: "standalone",
    background_color: "#22272d",
    theme_color: "#22272d",
    lang: "th",
    // Generated from design/logo.jpg
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
