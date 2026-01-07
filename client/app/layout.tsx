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
  title: {
    default: "Orca ClI - AI-powered Git Workflow",
    template: "%s | Orca ClI",
  },
  description: "Orca is an AI-powered CLI that intelligently groups your changes into semantic commits using multiple AI models. Stop micro-managing Git.",
  keywords: ["git", "ai", "cli", "workflow", "developer tools", "productivity", "semantic commits"],
  openGraph: {
    title: "Orca ClI - AI-powered Git Workflow",
    description: "Intelligently group changes into semantic commits. Stop micro-managing Git.",
    url: "https://orcacli.codes",
    siteName: "Orca ClI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Orca ClI - AI-powered Git Workflow",
    description: "Intelligently group changes into semantic commits. Stop micro-managing Git.",
  },
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
