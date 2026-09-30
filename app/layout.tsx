import type { Metadata } from "next";
import { Bricolage_Grotesque, Caveat, Rubik_Mono_One } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const display = Rubik_Mono_One({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const ui = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-ui" });
const hand = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-hand" });

export const metadata: Metadata = {
  title: "The Confession Booth",
  description: "Anonymous confessions. No names, no judgment (ok, a little judgment).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable} ${hand.variable}`}>
      <body>{children}</body>
    </html>
  );
}
