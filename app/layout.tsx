import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SupportChat } from "@/components/ui/SupportChat";
import { LanguageProvider } from "@/contexts/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'yuvrs-invoice.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Yuvr's - Professional Invoicing Made Simple",
    template: "%s | Yuvr's"
  },
  description: "Generate, manage, and track your invoices with ease. Professional PDF generation, client management, and automated tracking for global businesses.",
  keywords: ["invoicing", "SaaS", "billing", "PDF invoices", "business management", "freelance invoicing"],
  authors: [{ name: "YUVR Team" }],
  creator: "YUVR",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    title: "Yuvr's - Professional Invoicing Made Simple",
    description: "The ultimate invoicing solution for modern businesses. Simple, fast, and global.",
    siteName: "Yuvr's",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Yuvr's Invoicing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yuvr's - Professional Invoicing Made Simple",
    description: "The ultimate invoicing solution for modern businesses.",
    images: ["/og-image.png"],
    creator: "@yuvrs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <SupportChat />
      </body>
    </html>
  );
}
