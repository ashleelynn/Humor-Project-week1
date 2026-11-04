import type { Metadata, Viewport } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Hinge sets headlines in Tiempos Headline Light and everything else in Modern Era. Both are
// licensed faces, so these open fonts stand in: Source Serif 4 (with optical sizes, so big
// headlines get the sharper display cut) for Tiempos, DM Sans for Modern Era.
const serif = Source_Serif_4({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-serif",
});

const sans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "The Confession Booth",
  description: "Anonymous confessions. No names, no judgment (ok, a little judgment).",
};

export const viewport: Viewport = { colorScheme: "light", themeColor: "#FFFEFD" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
