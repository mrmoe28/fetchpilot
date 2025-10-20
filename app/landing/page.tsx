"use client"

import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { StatsSection } from "@/components/landing/stats-section"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main>
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <StatsSection />
      </main>
      
      <Footer />
    </div>
  )
}
