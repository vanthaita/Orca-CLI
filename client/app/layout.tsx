import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Providers from "./providers";
import { AdminShortcut } from "@/component/AdminShortcut";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://orcacli.codes"),
  title: {
    default: "Orca CLI - AI-powered Git Workflow",
    template: "%s | Orca CLI",
  },
  description: "Orca is an AI-powered CLI that intelligently groups your changes into semantic commits using multiple AI models. Stop micro-managing Git.",
  applicationName: "Orca CLI",
  authors: [{ name: "Orca Team", url: "https://orcacli.codes" }],
  keywords: ["git", "ai", "cli", "workflow", "developer tools", "productivity", "semantic commits", "git automation", "artificial intelligence"],
  creator: "Orca Team",
  publisher: "Orca Team",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
    },
  },
  openGraph: {
    title: "Orca CLI - AI-powered Git Workflow",
    description: "Intelligently group changes into semantic commits. Stop micro-managing Git.",
    url: "https://orcacli.codes",
    siteName: "Orca CLI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png", // Ensure this exists in public/ folder
        width: 1200,
        height: 630,
        alt: "Orca CLI - AI-powered Git Workflow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orca CLI - AI-powered Git Workflow",
    description: "Intelligently group changes into semantic commits. Stop micro-managing Git.",
    creator: "@orcacli",
    images: ["/og-image.png"],
  },
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Orca CLI",
  "operatingSystem": "Windows, macOS, Linux",
  "applicationCategory": "DeveloperApplication",
  "description": "AI-powered CLI that intelligently groups your changes into semantic commits.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "author": {
    "@type": "Organization",
    "name": "Orca Team",
    "url": "https://orcacli.codes"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <AuthProvider>
            <AdminShortcut />
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
