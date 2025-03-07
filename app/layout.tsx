import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prompt Party | AI Image Generation Game",
  description: "A fun multiplayer game where players create AI-generated images based on prompts and compete for the judge's approval. Create, compete, and celebrate creativity!",
  keywords: "AI image generation, multiplayer game, creative game, AI art, party game, image generation game",
  authors: [{ name: "Prompt Party" }],
  creator: "Prompt Party",
  publisher: "Prompt Party",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://promptparty.ai",
    siteName: "Prompt Party",
    title: "Prompt Party | AI Image Generation Game",
    description: "A fun multiplayer game where players create AI-generated images based on prompts and compete for the judge's approval. Create, compete, and celebrate creativity!",
    images: [
      {
        url: "/og-image.png", // You'll need to create this image
        width: 1200,
        height: 630,
        alt: "Prompt Party - AI Image Generation Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Party | AI Image Generation Game",
    description: "A fun multiplayer game where players create AI-generated images based on prompts and compete for the judge's approval. Create, compete, and celebrate creativity!",
    images: ["/og-image.png"], // Same image as OpenGraph
    creator: "@promptparty",
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
  verification: {
    google: "your-google-site-verification", // Add your Google Search Console verification code
  },
  alternates: {
    canonical: "https://promptparty.ai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5866571337400667"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-r from-[#8b3858] to-[#56afca]`}
      >
        {children}
      </body>
    </html>
  );
}
