"use client"

import { motion, useInView, useReducedMotion } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { Github, Twitter, Linkedin, Mail, ArrowUp, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fadeInUp, fadeInUpReduced, getMotionVariant } from "@/lib/utils/animations"

const footerSections = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "API Docs", href: "/docs" },
      { name: "Integrations", href: "/integrations" },
      { name: "Changelog", href: "/changelog" }
    ]
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Press Kit", href: "/press" },
      { name: "Contact", href: "/contact" }
    ]
  },
  {
    title: "Resources",
    links: [
      { name: "Help Center", href: "/help" },
      { name: "Community", href: "/community" },
      { name: "Tutorials", href: "/tutorials" },
      { name: "Status", href: "/status" },
      { name: "Security", href: "/security" }
    ]
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "GDPR", href: "/gdpr" },
      { name: "Compliance", href: "/compliance" }
    ]
  }
]

const socialLinks = [
  { name: "GitHub", icon: Github, href: "https://github.com/fetchpilot" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/fetchpilot" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/fetchpilot" },
  { name: "Email", icon: Mail, href: "mailto:hello@fetchpilot.com" }
]

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const shouldReduceMotion = useReducedMotion()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <footer ref={ref} className="bg-slate-900 text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(59,130,246,0.1),transparent_50%)]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main footer content */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          className="py-16"
        >
          {/* Top section with logo and newsletter */}
          <div className="grid lg:grid-cols-3 gap-12 mb-16">
            {/* Company info */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white grid place-content-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <div className="w-8 h-8 border-2 border-white rounded-sm" />
                </div>
                <span className="text-3xl font-bold">FetchPilot</span>
              </Link>
              
              <p className="text-slate-300 text-lg leading-relaxed mb-6 max-w-md">
                Autonomous web intelligence agent that transforms how you extract and process 
                data from any website with AI-powered precision.
              </p>

              {/* Social links */}
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                    className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center justify-center group"
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Newsletter signup */}
            <div className="lg:col-span-2">
              <div className="glass-card p-8 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10">
                <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
                <p className="text-slate-300 mb-6">
                  Get the latest updates on new features, integrations, and web scraping insights.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all duration-200"
                  />
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 rounded-xl font-medium whitespace-nowrap">
                    Subscribe
                  </Button>
                </div>
                
                <p className="text-xs text-slate-400 mt-4">
                  By subscribing, you agree to our Privacy Policy. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>

          {/* Links sections */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {footerSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
                transition={{ delay: 0.1 * index }}
              >
                <h4 className="text-lg font-semibold mb-6 text-white">{section.title}</h4>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-white transition-colors duration-200 hover:underline"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom section */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
          transition={{ delay: 0.5 }}
          className="border-t border-white/10 py-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-slate-400">
              <p className="text-sm">
                © {new Date().getFullYear()} FetchPilot. All rights reserved.
              </p>
              <div className="flex items-center gap-1 text-sm">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-400 fill-current" />
                <span>for developers</span>
              </div>
            </div>

            {/* Back to top button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollToTop}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 group"
              aria-label="Back to top"
            >
              <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
