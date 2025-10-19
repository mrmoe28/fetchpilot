import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: {
    default: "FetchPilot - Autonomous Web Intelligence Agent",
    template: "%s | FetchPilot"
  },
  description: "Autonomous web intelligence agent that reasons, adapts, and extracts structured data from any website using LLM-guided scraping strategies.",
  keywords: ["web scraping", "data extraction", "AI agent", "LLM", "automation"],
  authors: [{ name: "FetchPilot Team" }],
  creator: "FetchPilot",
  openGraph: {
    type: "website",
    title: "FetchPilot - Autonomous Web Intelligence Agent",
    description: "Autonomous web intelligence agent that reasons, adapts, and extracts.",
    siteName: "FetchPilot"
  },
  twitter: {
    card: "summary_large_image",
    title: "FetchPilot",
    description: "Autonomous web intelligence agent"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="text-fetchpilot-text">
        <Header />
        <main className="max-w-6xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
