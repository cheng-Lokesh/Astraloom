import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Marcellus } from "next/font/google";
import { LanguageProvider } from "@/components/language-provider";
import { BRAND_NAME, PRODUCT_DESCRIPTOR, TAGLINE } from "@/lib/brand";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import "./reality-hero.css";
import "./interactive-observatory-hero.css";
import "./cinematic-command-hero.css";
import "./portfolio-inspired-landing.css";
import "./portfolio-app-theme.css";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken-grotesk",
});

const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marcellus",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Reality-first future path simulator`,
  description: `${TAGLINE} ${BRAND_NAME} is ${PRODUCT_DESCRIPTOR}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${marcellus.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
