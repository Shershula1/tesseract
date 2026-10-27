import type { Metadata } from "next";
import { Cormorant_Garamond, Literata } from "next/font/google";

import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const body = Literata({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Четырёхмерный куб",
  description:
    "Что такое тессеракт, как его собирают из куба и почему на экране он выглядит вложенным и кривым.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full font-body">{children}</body>
    </html>
  );
}
