import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cracked",
    short_name: "Cracked",
    description: "Every task, visibly connected to the goal it serves.",
    start_url: "/",
    display: "standalone",
    background_color: "#14140f",
    theme_color: "#14140f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
