import type { Metadata } from "next";
import localFont from "next/font/local";
import { LanguageProvider } from "@/components/language-provider";
import { BRAND_NAME, PRODUCT_DESCRIPTOR, TAGLINE } from "@/lib/brand";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import "./reality-hero.css";
import "./interactive-observatory-hero.css";
import "./cinematic-command-hero.css";
import "./portfolio-inspired-landing.css";
import "./portfolio-app-theme.css";

const hankenGrotesk = localFont({
  src: "./fonts/hanken-grotesk/HankenGrotesk-Variable.ttf",
  display: "swap",
  weight: "100 900",
  style: "normal",
  variable: "--font-hanken-grotesk",
});

const marcellus = localFont({
  src: "./fonts/marcellus/Marcellus-Regular.ttf",
  display: "swap",
  weight: "400",
  style: "normal",
  variable: "--font-marcellus",
});

const jetBrainsMono = localFont({
  src: "./fonts/jetbrains-mono/JetBrainsMono-Variable.ttf",
  display: "swap",
  weight: "100 800",
  style: "normal",
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
