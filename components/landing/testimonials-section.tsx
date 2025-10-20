"use client"

import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  fadeInUp,
  fadeInUpReduced,
  getMotionVariant
} from "@/lib/utils/animations"

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Head of Data Engineering",
    company: "TechFlow Inc",
    image: "/api/placeholder/80/80",
    content: "FetchPilot transformed our data collection workflow. What used to take our team hours now happens in minutes with incredible accuracy. The AI adaptation is simply magical.",
    rating: 5,
    stats: "500% faster data collection"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    role: "CTO",
    company: "DataScope Analytics", 
    image: "/api/placeholder/80/80",
    content: "The self-correcting capabilities are game-changing. When e-commerce sites update their layouts, FetchPilot adapts automatically. No more broken scrapers.",
    rating: 5,
    stats: "99.9% uptime achieved"
  },
  {
    id: 3,
    name: "Emily Watson",
    role: "Research Director",
    company: "Market Intelligence Pro",
    image: "/api/placeholder/80/80",
    content: "We've processed millions of pages across thousands of websites. FetchPilot's universal compatibility and speed have revolutionized our research capabilities.",
    rating: 5,
    stats: "10M+ pages processed"
  },
  {
    id: 4,
    name: "David Kim",
    role: "Founder",
    company: "PriceTracker",
    image: "/api/placeholder/80/80",
    content: "The enterprise security features give us complete confidence. SOC 2 compliance and end-to-end encryption mean we can trust FetchPilot with sensitive data.",
    rating: 5,
    stats: "100% security compliance"
  }
]

export function TestimonialsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const shouldReduceMotion = useReducedMotion()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [isPaused])

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section 
      ref={ref} 
      className="py-24 bg-slate-50 dark:bg-slate-900 relative overflow-hidden"
      aria-labelledby="testimonials-heading"
      role="region"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/30 text-blue-700 dark:bg-slate-800/80 dark:border-slate-700/50 dark:text-blue-300 text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-current" />
            <span>Trusted by Industry Leaders</span>
          </div>
          
          <h2 
            id="testimonials-heading"
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            <span className="text-slate-900 dark:text-white">What Our </span>
            <span className="gradient-text">Customers Say</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Join thousands of companies who trust FetchPilot for their web intelligence needs.
          </p>
        </motion.div>

        {/* Main testimonial display */}
        <div 
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          role="region"
          aria-label="Customer testimonials carousel"
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="glass-card p-8 md:p-12 rounded-3xl text-center relative overflow-hidden"
            >
              {/* Quote decoration */}
              <div className="absolute top-6 left-6 text-blue-200 dark:text-blue-800">
                <Quote className="w-12 h-12" />
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-1 mb-8">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Testimonial content */}
              <blockquote className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-8 leading-relaxed font-medium">
                "{testimonials[currentIndex].content}"
              </blockquote>

              {/* Stats badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
                {testimonials[currentIndex].stats}
              </div>

              {/* Author info */}
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                  {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-white text-lg">
                    {testimonials[currentIndex].name}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {testimonials[currentIndex].role}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium">
                    {testimonials[currentIndex].company}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-white/30 hover:bg-white/90 shadow-lg dark:bg-slate-800/80 dark:border-slate-700/50 dark:hover:bg-slate-800/90"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-white/30 hover:bg-white/90 shadow-lg dark:bg-slate-800/80 dark:border-slate-700/50 dark:hover:bg-slate-800/90"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Testimonial indicators */}
        <div className="flex justify-center gap-3 mt-12">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? "bg-blue-600 dark:bg-blue-400 w-8" 
                  : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
              }`}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>

        {/* Customer logos */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          transition={{ delay: 0.5 }}
          className="mt-20 text-center"
        >
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 uppercase tracking-wide font-medium">
            Trusted by 500+ Companies Worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 dark:opacity-40">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="text-2xl font-bold text-slate-400 dark:text-slate-500">
                {testimonial.company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
