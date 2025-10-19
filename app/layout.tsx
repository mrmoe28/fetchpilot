import "./globals.css"
import type { Metadata } from "next"
import { ReactNode } from "react"
import Header from "@/components/header"
import { ToastProvider } from "@/lib/providers/toast-provider"

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
      <body className="text-foreground antialiased">
        <ToastProvider>
          <Header />
          <main className="max-w-7xl mx-auto px-6 py-12">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
