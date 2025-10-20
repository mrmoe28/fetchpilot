"use client"

import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Sparkles, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  fadeInUp, 
  fadeInLeft, 
  fadeInRight, 
  scaleIn,
  fadeInUpReduced,
  scaleInReduced,
  getMotionVariant,
  buttonHover,
  buttonTap
} from "@/lib/utils/animations"

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-label="Hero section"
      role="banner"
    >
      {/* Background gradients and particles */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900" />
      
      {/* Animated background particles */}
      <div className="particles" />
      
      {/* Floating orbs */}
      <motion.div
        className="floating-orb w-72 h-72 bg-blue-400 top-20 left-20"
        animate={shouldReduceMotion ? {} : { y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="floating-orb w-64 h-64 bg-purple-400 top-40 right-20"
        animate={shouldReduceMotion ? {} : { y: [0, -20, 0], x: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="floating-orb w-48 h-48 bg-cyan-400 bottom-40 left-1/3"
        animate={shouldReduceMotion ? {} : { y: [0, 25, 0], x: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-white/30 text-blue-700 text-sm font-medium mb-6 dark:bg-slate-800/80 dark:border-slate-700/50 dark:text-blue-300">
            <Sparkles className="w-4 h-4" />
            <span>Welcome to the Future of Web Intelligence</span>
          </div>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
          role="heading"
          aria-level={1}
        >
          <span className="gradient-text">
            Autonomous
          </span>
          <br />
          <span className="text-slate-900 dark:text-white">
            Web Intelligence
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed"
        >
          FetchPilot is an autonomous web intelligence agent that reasons, adapts, and extracts 
          structured data from any website using advanced LLM-guided strategies.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={getMotionVariant(scaleIn, scaleInReduced, shouldReduceMotion)}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <motion.div
            whileHover={shouldReduceMotion ? {} : buttonHover}
            whileTap={shouldReduceMotion ? {} : buttonTap}
          >
            <Button 
              asChild
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
              <Link 
                href="/auth/signin"
                aria-label="Sign in to your FetchPilot account"
              >
                Sign In
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            whileHover={shouldReduceMotion ? {} : buttonHover}
            whileTap={shouldReduceMotion ? {} : buttonTap}
          >
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white/80 backdrop-blur-sm border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-8 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group dark:bg-slate-800/80 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-500 focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-600"
              aria-label="Learn more about FetchPilot features and capabilities"
            >
              Learn More
              <Zap className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" aria-hidden="true" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            { icon: Sparkles, title: "AI-Powered", desc: "LLM-guided extraction" },
            { icon: Zap, title: "Lightning Fast", desc: "HTTP-first approach" },
            { icon: ArrowRight, title: "Self-Adapting", desc: "Auto-correcting strategies" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate="visible"
              variants={getMotionVariant(scaleIn, scaleInReduced, shouldReduceMotion)}
              transition={{ delay: 0.8 + (index * 0.1) }}
              className="glass-card p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white grid place-content-center shadow-md mx-auto mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center dark:border-slate-500"
        >
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, 16, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-3 bg-slate-400 rounded-full mt-2 dark:bg-slate-500"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
