"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Leaf, ArrowRight, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabase-client"
function MolecularBackground() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight })
    
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Don't render particles until we have dimensions
  if (dimensions.width === 0) return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Static background elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-cyan-500/15 to-emerald-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-cyan-500/15 to-emerald-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Molecular grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="molecular-grid" x="100" y="100" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="3" fill="rgba(16, 185, 129, 0.4)" />
            <line x1="50" y1="50" x2="100" y2="50" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" />
            <line x1="50" y1="50" x2="50" y2="100" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#molecular-grid)" />
      </svg>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-emerald-400/60"
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          }}
          animate={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      // Use Supabase client-side authentication
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: "farmer"
          }
        }
      })

      if (authError) {
        setError(authError.message || "Signup failed")
        return
      }

      if (!authData.user) {
        setError("Failed to create account")
        return
      }

      // Call our API to create the profile (still needed for database setup)
      const profileResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          userId: authData.user.id
        }),
      })

      if (!profileResponse.ok) {
        const profileData = await profileResponse.json()
        setError(profileData.error || "Profile creation failed")
        return
      }

      // Check if email confirmation is required
      if (authData.session) {
        // User is auto-logged in (email confirmation disabled)
        router.push("/dashboard")
      } else {
        // Email confirmation required
        setError("Account created! Please check your email to confirm your account before logging in.")
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <MolecularBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        {/* Logo */}
        <motion.div className="flex items-center justify-center gap-3" whileHover={{ scale: 1.05 }}>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg neon-glow">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            FarmGenius AI
          </span>
        </motion.div>

        {/* Signup Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="p-8 border border-emerald-500/20 bg-slate-900/80 backdrop-blur-xl shadow-2xl">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Create Your Account
                </h1>
                <p className="text-slate-400">Join FarmGenius AI today</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-slate-300">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    name="fullName"
                    placeholder="John Farmer"
                    value={formData.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                    className="bg-slate-800/50 border-emerald-500/30 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    className="bg-slate-800/50 border-emerald-500/30 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                      className="bg-slate-800/50 border-emerald-500/30 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                      className="bg-slate-800/50 border-emerald-500/30 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? "Creating account..." : "Create Account"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">Already have an account?</span>
                </div>
              </div>

              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 bg-transparent"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>

        <p className="text-center text-xs text-slate-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}
