import type { Metadata, Viewport } from "next";
import { Header, Footer } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nexuspoint.ae"),
  title: {
    default: "NexusPoint | Smart POS Solutions in UAE",
    template: "%s | NexusPoint",
  },
  description:
    "NexusPoint is a professional POS solutions company based in the UAE, specialized in point of sale systems for restaurants, cafes, and retail shops.",
  keywords: [
    "POS system UAE",
    "restaurant POS",
    "cafe POS",
    "retail POS",
    "point of sale UAE",
    "POS software",
    "POS hardware",
    "Al Ain POS",
    "tablet POS",
    "NexusPoint",
  ],
  authors: [{ name: "NexusPoint" }],
  creator: "NexusPoint",
  publisher: "NexusPoint",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AE",
    url: "https://nexuspoint.ae",
    siteName: "NexusPoint",
    title: "NexusPoint | Smart POS Solutions in UAE",
    description:
      "Complete point of sale solutions for restaurants, cafes, and retail shops in the UAE.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NexusPoint - Smart POS Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NexusPoint | Smart POS Solutions in UAE",
    description:
      "Complete point of sale solutions for restaurants, cafes, and retail shops in the UAE.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://nexuspoint.ae",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
