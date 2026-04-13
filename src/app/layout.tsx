import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import {
  SHARE_IMAGE_HEIGHT,
  SHARE_IMAGE_PNG_PATH,
  SHARE_IMAGE_SVG_PATH,
  SHARE_IMAGE_WIDTH,
  SHARE_TAGLINE,
  SHARE_TITLE,
  SITE_URL,
} from "@/lib/content/share-metadata";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SHARE_TITLE,
  description: SHARE_TAGLINE,
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_TAGLINE,
    type: "website",
    siteName: SHARE_TITLE,
    locale: "ko_KR",
    images: [
      {
        url: SHARE_IMAGE_PNG_PATH,
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        alt: SHARE_TITLE,
        type: "image/png",
      },
      {
        url: SHARE_IMAGE_SVG_PATH,
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        alt: SHARE_TITLE,
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_TAGLINE,
    images: [SHARE_IMAGE_PNG_PATH],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
