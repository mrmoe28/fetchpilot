"use client"

import { useState, useEffect } from "react"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { Menu, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { fadeInUp, fadeInUpReduced, getMotionVariant } from "@/lib/utils/animations"

const navItems = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Docs", href: "/docs" },
  { name: "Support", href: "#support" }
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={getMotionVariant(fadeInUp, fadeInUpReduced, shouldReduceMotion)}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-lg border-b border-white/20 dark:border-slate-700/20" 
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white grid place-content-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <div className="w-6 h-6 border-2 border-white rounded-sm" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                FetchPilot
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200 relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 group-hover:w-full transition-all duration-200" />
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              
              <Button 
                variant="ghost"
                asChild
                className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Link href="/auth/signin">Sign In</Link>
              </Button>

              <Button 
                asChild
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
              >
                <Link href="/auth/signin">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-10 h-10 rounded-xl"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={false}
          animate={{
            height: isMobileMenuOpen ? "auto" : 0,
            opacity: isMobileMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="md:hidden overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-white/20 dark:border-slate-700/20"
        >
          <div className="px-6 py-6 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2 transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            <hr className="border-slate-200 dark:border-slate-700" />
            
            <div className="space-y-3 pt-2">
              <Button 
                variant="ghost"
                asChild
                className="w-full justify-start text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Link href="/auth/signin">Sign In</Link>
              </Button>

              <Button 
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg"
              >
                <Link href="/auth/signin">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.nav>

      {/* Spacer to prevent content from hiding under fixed navbar */}
      <div className="h-16 md:h-20" />
    </>
  )
}
