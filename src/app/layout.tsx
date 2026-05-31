import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language-provider";
import { BRAND_NAME, PRODUCT_DESCRIPTOR, TAGLINE } from "@/lib/brand";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Destiny-situation sandbox`,
  description: `${TAGLINE} ${BRAND_NAME} is ${PRODUCT_DESCRIPTOR}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
