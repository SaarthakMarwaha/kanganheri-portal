import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kanganheri Darpan — Village Kanganheri Digital Civic Portal",
    short_name: "कांगनहेड़ी दर्पण",
    description:
      "Official bilingual digital village and civic utility portal for Village Kanganheri (PIN 110071), Najafgarh Zone, South West Delhi.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f3",
    theme_color: "#f97316",
    orientation: "portrait",
    categories: ["government", "utilities", "social", "news"],
    lang: "hi",
    dir: "ltr",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
