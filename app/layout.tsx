import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import "lenis/dist/lenis.css"; // small stylesheet Lenis needs to work correctly
import "./globals.css";

/*
 * next/font downloads these fonts at BUILD time and serves them from our own
 * domain, so visitors never make a request to Google (privacy + speed), and
 * the text never "jumps" when the font arrives.
 */
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const heading = Syne({ subsets: ["latin"], variable: "--font-heading", weight: ["400", "700", "800"], display: "swap" });

const title = "RESONANCE // Halcyon Drift — Afterglow (Concept)";
const description =
  "Concept release page for a fictional electronic single: a real-time 3D visual driven by the music through the Web Audio API. Designed & developed by Waleed Atiq.";

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: "Waleed Atiq" }],
  openGraph: { title, description, type: "website", siteName: "RESONANCE — concept by Waleed Atiq" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#06060a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
