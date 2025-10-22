import type { Metadata } from "next"
import { ReactNode } from "react"

export const metadata: Metadata = {
  title: {
    default: "FetchPilot - Autonomous Web Intelligence Agent",
    template: "%s | FetchPilot"
  },
  description: "Autonomous web intelligence agent that reasons, adapts, and extracts structured data from any website using LLM-guided scraping strategies. Experience the future of web data extraction.",
  keywords: ["web scraping", "data extraction", "AI agent", "LLM", "automation", "web intelligence", "artificial intelligence"],
  authors: [{ name: "FetchPilot Team" }],
  creator: "FetchPilot",
  openGraph: {
    type: "website",
    title: "FetchPilot - Autonomous Web Intelligence Agent",
    description: "Experience the future of web data extraction with AI-powered precision and enterprise reliability.",
    siteName: "FetchPilot",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FetchPilot - Autonomous Web Intelligence Agent"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "FetchPilot - Autonomous Web Intelligence Agent",
    description: "Experience the future of web data extraction with AI-powered precision.",
    images: ["/og-image.png"]
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
    google: "your-google-site-verification-code",
  }
}

export default function LandingLayout({ children }: { children: ReactNode }) {
  // Landing layout - renders without Header since landing page has its own navbar
  return <>{children}</>
}
