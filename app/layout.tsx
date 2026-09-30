import type { Metadata, Viewport } from "next";
import { VT323 } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

// VTC Bayard is a TRIAL font. Only A-Z a-z 0-9 ! , . ? ’ “ ” and space are real glyphs,
// so the unicode-range sends every other character to VT323.
const bayard = localFont({
  src: "./fonts/VTCBayard-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-bayard",
  adjustFontFallback: false, // otherwise out-of-range chars fall to a size-adjusted Arial instead of VT323
  declarations: [
    { prop: "unicode-range", value: "U+0020-0021, U+002C, U+002E, U+0030-0039, U+003F, U+0041-005A, U+0061-007A, U+2019, U+201C-201D" },
    { prop: "ascent-override", value: "85.5%" },
    { prop: "descent-override", value: "20%" },
    { prop: "line-gap-override", value: "0%" },
  ],
});

const vt = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-vt",
  adjustFontFallback: false, // keeps a real monospace fallback during swap, so ASCII columns hold
  fallback: ["ui-monospace", "Menlo", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "The Confession Booth",
  description: "Anonymous confessions. No names, no judgment (ok, a little judgment).",
};

export const viewport: Viewport = { colorScheme: "light", themeColor: "#FAF6EA" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${bayard.variable} ${vt.variable}`}>
      <body>{children}</body>
    </html>
  );
}
