import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JuroMart - Express Shopping & Fast Doorstep Delivery",
    short_name: "JuroMart",
    description: "Shop electronics, fashion, and everyday essentials with instant dispatch, live courier tracking, and secure M-Pesa checkout.",
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
