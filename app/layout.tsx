import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Final 450 — DSA Tracker",
  description: "Track your progress through the Love Babbar Final 450 DSA sheet.",
  keywords: ["DSA", "Data Structures", "Algorithms", "Love Babbar", "450 DSA", "Tracker", "Coding", "Interview Preparation"],
  openGraph: {
    title: "Final 450 — DSA Tracker",
    description: "Track your progress through the Love Babbar Final 450 DSA sheet.",
    url: "/",
    siteName: "Final 450 DSA",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Final 450 — DSA Tracker",
    description: "Track your progress through the Love Babbar Final 450 DSA sheet.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-y-scroll`}
      >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
