"use client"

import { motion, useInView, useReducedMotion } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { TrendingUp, Users, Globe, Zap } from "lucide-react"
import { 
  staggerContainer, 
  staggerItem,
  fadeInUp,
  staggerContainerReduced,
  fadeInUpReduced,
  getMotionVariant
} from "@/lib/utils/animations"

const stats = [
  {
    icon: Users,
    label: "Active Users",
    value: 50000,
    suffix: "+",
    description: "Companies trust FetchPilot",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Globe,
    label: "Websites Supported",
    value: 1000000,
    suffix: "+",
    description: "Sites successfully scraped",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: TrendingUp,
    label: "Data Points Extracted",
    value: 100000000,
    suffix: "+",
    description: "Accurate extractions daily",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Zap,
    label: "Performance Boost",
    value: 10,
    suffix: "x",
    description: "Faster than traditional methods",
    gradient: "from-orange-500 to-red-500"
  }
]

// Custom hook for number animation
function useCountUp(end: number, duration: number = 2000, delay: number = 0) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (!hasStarted) return

    const timer = setTimeout(() => {
      let start = 0
      const increment = end / (duration / 16)
      
      const counter = setInterval(() => {
        start += increment
        if (start >= end) {
          setCount(end)
          clearInterval(counter)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(counter)
    }, delay)

    return () => clearTimeout(timer)
  }, [end, duration, delay, hasStarted])

  return [count, () => setHasStarted(true)] as const
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B"
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

function StatCard({ stat, index }: { stat: typeof stats[0], index: number }) {
  const shouldReduceMotion = useReducedMotion()
  const [count, startCounting] = useCountUp(stat.value, 2000, index * 200)

  useEffect(() => {
    startCounting()
  }, [startCounting])

  return (
    <motion.div
      variants={getMotionVariant(staggerItem, fadeInUpReduced, shouldReduceMotion)}
      className="text-center group"
    >
      <div className="glass-card p-8 rounded-3xl hover:scale-105 transition-all duration-300 hover:shadow-2xl relative overflow-hidden">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
        
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white grid place-content-center shadow-lg mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
          <stat.icon className="w-8 h-8" />
        </div>

        {/* Number */}
        <div className="mb-4">
          <div className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
            {shouldReduceMotion ? formatNumber(stat.value) : formatNumber(count)}
            <span className="text-3xl md:text-4xl">{stat.suffix}</span>
          </div>
          <div className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {stat.label}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {stat.description}
          </div>
        </div>

        {/* Pulse effect for the number */}
        {!shouldReduceMotion && count < stat.value && (
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent animate-pulse" />
        )}
      </div>
    </motion.div>
  )
}

export function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const shouldReduceMotion = useReducedMotion()

  return (
    <section 
      ref={ref} 
      className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden"
      aria-labelledby="stats-heading"
      role="region"
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)] opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.3),transparent_50%)] opacity-50" />
      
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <div className="particles opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          className="text-center mb-20"
        >
          <h2 
            id="stats-heading"
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            <span className="text-white">Trusted by </span>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Thousands
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Join the growing community of developers and companies who rely on FetchPilot 
            for their web intelligence needs.
          </p>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(staggerContainer, staggerContainerReduced, shouldReduceMotion)}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} index={index} />
          ))}
        </motion.div>

        {/* Bottom CTA section */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          transition={{ delay: 0.8 }}
          className="text-center mt-20"
        >
          <div className="glass-card p-8 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20">
            <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of companies who trust FetchPilot for reliable, 
              scalable web data extraction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                className="px-8 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl font-semibold text-white hover:bg-white/30 transition-all duration-200"
              >
                View Pricing
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
