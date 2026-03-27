import type { Metadata } from "next";
import { DM_Sans, Merriweather } from "next/font/google";
import { getPublicSiteUrl } from "@/lib/metadata/site";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
  display: "swap",
});

const merriweather = Merriweather({
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-merriweather",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: {
    default: "ThaiAdvice.com",
    template: "%s | ThaiAdvice.com",
  },
  description: "Tayland seyahat rehberi: bölgeler, alt bölgeler ve mekanlar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${dmSans.variable} ${merriweather.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
