import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Classic Spanish",
    short_name: "Classic Spanish",
    description: "APplus Classic-inspired PWA do codziennej nauki hiszpanskiego.",
    start_url: "/today",
    display: "standalone",
    background_color: "#f4f7fb",
    theme_color: "#f4f7fb",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/maskable-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
