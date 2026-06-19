import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
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
  title: "Final 450 DSA Tracker | Master Data Structures & Algorithms",
  description: "Master Data Structures and Algorithms with the ultimate Final 450 DSA Tracker. Curated topic-wise DSA sheet to crack coding interviews and become a DSA Ninja! 🚀",
  keywords: ["DSA", "Data Structures", "Algorithms", "450 DSA", "Tracker", "Coding", "Interview Preparation", "DSA Ninja", "Cracker"],
  openGraph: {
    title: "Final 450 DSA Tracker | Master Data Structures & Algorithms",
    description: "Master Data Structures and Algorithms with the ultimate Final 450 DSA Tracker. Curated topic-wise DSA sheet to crack coding interviews and become a DSA Ninja! 🚀",
    url: "/",
    siteName: "Final 450 DSA",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Final 450 DSA Tracker | Master Data Structures & Algorithms",
    description: "Master Data Structures and Algorithms with the ultimate Final 450 DSA Tracker. Curated topic-wise DSA sheet to crack coding interviews and become a DSA Ninja! 🚀",
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
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
