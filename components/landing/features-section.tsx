"use client"

import { motion, useInView, useReducedMotion } from "framer-motion"
import { useRef } from "react"
import { Brain, Globe, Zap, Target, Shield, Sparkles } from "lucide-react"
import { 
  staggerContainer, 
  staggerItem, 
  fadeInUp,
  scaleIn,
  staggerContainerReduced,
  fadeInUpReduced,
  scaleInReduced,
  getMotionVariant
} from "@/lib/utils/animations"

const features = [
  {
    icon: Brain,
    title: "LLM-Guided Intelligence",
    description: "Advanced language models analyze page structure and adapt extraction strategies in real-time, ensuring accurate data capture from any website.",
    gradient: "from-purple-500 to-indigo-600",
    stats: "99.8% accuracy"
  },
  {
    icon: Zap,
    title: "Lightning-Fast Performance",
    description: "HTTP-first approach with intelligent caching and parallel processing delivers results up to 10x faster than traditional scraping methods.",
    gradient: "from-blue-500 to-cyan-600",
    stats: "10x faster"
  },
  {
    icon: Globe,
    title: "Universal Compatibility",
    description: "Works seamlessly across all website types - from SPAs to traditional sites, handling JavaScript rendering and complex authentication flows.",
    gradient: "from-green-500 to-emerald-600",
    stats: "Any website"
  }
]

const additionalFeatures = [
  {
    icon: Target,
    title: "Precision Targeting",
    description: "AI-powered element detection ensures you get exactly the data you need"
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with end-to-end encryption and secure data handling"
  },
  {
    icon: Sparkles,
    title: "Self-Correcting",
    description: "Automatically adapts when websites change, maintaining reliability"
  }
]

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const shouldReduceMotion = useReducedMotion()

  return (
    <section 
      ref={ref} 
      className="py-24 bg-white/50 dark:bg-slate-900/50 relative overflow-hidden"
      aria-labelledby="features-heading"
      role="region"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/50 to-transparent dark:via-blue-900/10" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          className="text-center mb-20"
        >
          <h2 
            id="features-heading"
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            <span className="gradient-text">Powerful Features</span>
            <br />
            <span className="text-slate-900 dark:text-white">Built for Scale</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Experience the next generation of web data extraction with cutting-edge AI technology 
            and enterprise-grade reliability.
          </p>
        </motion.div>

        {/* Main features grid */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(staggerContainer, staggerContainerReduced, shouldReduceMotion)}
          className="grid md:grid-cols-3 gap-8 mb-20"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={getMotionVariant(staggerItem, fadeInUpReduced, shouldReduceMotion)}
              className="group relative"
            >
              <div className="glass-card p-8 rounded-3xl h-full hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-3xl group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white grid place-content-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8" />
                </div>

                {/* Stats badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  {feature.stats}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional features */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(staggerContainer, staggerContainerReduced, shouldReduceMotion)}
          className="grid md:grid-cols-3 gap-6"
        >
          {additionalFeatures.map((feature, index) => (
            <motion.div
              key={index}
              variants={getMotionVariant(staggerItem, fadeInUpReduced, shouldReduceMotion)}
              className="flex items-start gap-4 p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 grid place-content-center shadow-sm flex-shrink-0">
                <feature.icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
