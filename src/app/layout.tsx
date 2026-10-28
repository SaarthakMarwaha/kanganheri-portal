import type { Metadata } from "next";

/**
 * Root layout — minimal shell.
 * The real layout with fonts and providers lives in /[locale]/layout.tsx.
 * This file is required by Next.js App Router as the top-level layout.
 */
export const metadata: Metadata = {
  title: "Kanganheri Darpan",
  description: "Digital Village Portal for Village Kanganheri, South West Delhi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
