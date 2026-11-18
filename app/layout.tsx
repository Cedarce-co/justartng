import type { Metadata, Viewport } from "next";
import { sans, serif } from "@/app/fonts";
import { siteUrl } from "@/lib/format";
import { site } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${site.brand} | ${site.tagline}`,
    template: `%s · ${site.brand}`,
  },
  description: site.description,
  applicationName: site.brand,
  // Link previews (WhatsApp, Facebook, X, LinkedIn…): image, title, description and address.
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.brand,
    title: `${site.brand} | ${site.tagline}`,
    description: site.description,
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Hues That Heal: Faith Art Exhibition 2.0" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.brand} | ${site.tagline}`,
    description: site.description,
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171614",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
