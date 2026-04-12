import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const SHARE_TITLE = "여기 근데";
const SHARE_TAGLINE = "한마디 할게요";
const SHARE_IMAGE_PATH = "/checkmark.svg";

export const metadata: Metadata = {
  metadataBase: new URL("https://herebtw2.vercel.app"),
  title: SHARE_TITLE,
  description: SHARE_TAGLINE,
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_TAGLINE,
    type: "website",
    images: [
      {
        url: SHARE_IMAGE_PATH,
        width: 500,
        height: 500,
        alt: SHARE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_TAGLINE,
    images: [SHARE_IMAGE_PATH],
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
      <body>{children}</body>
    </html>
  );
}
