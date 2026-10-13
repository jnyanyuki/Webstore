import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JuroMart - Nairobi CBD E-Commerce Marketplace",
    short_name: "JuroMart",
    description: "Verified Nairobi CBD express shopping with sub-45 minute Boda dispatch and M-Pesa checkout.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBFBFB",
    theme_color: "#059669",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
