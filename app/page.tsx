"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Leaf, ArrowRight, Zap, Brain, Globe, BarChart3, Droplets, Wind, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
    }> = []

    // Create more visible particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 3 + 1.5,
        opacity: Math.random() * 0.7 + 0.3,
      })
    }

    const animate = () => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Draw particles with gradient
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2)
        gradient.addColorStop(0, `rgba(16, 185, 129, ${p.opacity})`)
        gradient.addColorStop(1, `rgba(129, 212, 250, ${p.opacity * 0.3})`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections with better visibility
        particles.forEach((p2, j) => {
          if (i < j) {
            const dx = p.x - p2.x
            const dy = p.y - p2.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 200) {
              const opacity = (1 - distance / 200) * 0.4
              ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`
              ctx.lineWidth = 1.5
              ctx.beginPath()
              ctx.moveTo(p.x, p.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.stroke()
            }
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-40" />
}

function FloatingLeaves() {
  const [windowHeight, setWindowHeight] = useState(0)

  useEffect(() => {
    // Set initial window height
    setWindowHeight(window.innerHeight)
    
    // Handle window resize
    const handleResize = () => {
      setWindowHeight(window.innerHeight)
    }
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Don't render anything until we have the window height
  if (windowHeight === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ x: Math.random() * 100 + "%", y: -50, opacity: 0, rotate: 0 }}
          animate={{
            y: windowHeight + 50,
            opacity: [0, 0.8, 0],
            rotate: 360 + Math.random() * 180,
          }}
          transition={{
            duration: 18 + i * 2.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <Leaf className="w-10 h-10 text-emerald-500/50" />
        </motion.div>
      ))}
    </div>
  )
}

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      <AnimatedBackground />
      <FloatingLeaves />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.05 }}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg neon-glow">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              FarmGenius AI
            </span>
          </motion.div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
            <motion.div variants={itemVariants} className="space-y-8">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-sm font-medium text-emerald-300">AI-Powered Precision Agriculture</span>
              </motion.div>

              <div className="space-y-4">
                <motion.h1
                  variants={itemVariants}
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent leading-tight"
                >
                  Empowering Farmers with AI
                </motion.h1>
                <motion.p variants={itemVariants} className="text-xl text-slate-300 leading-relaxed max-w-xl">
                  Transform your farm with quantum-level AI insights. Real-time crop monitoring, predictive analytics,
                  and sustainable farming practices powered by advanced machine learning.
                </motion.p>
              </div>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-xl w-full sm:w-auto group"
                  >
                    Start Analysis
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 bg-transparent"
                >
                  Learn More
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-3 gap-4 pt-8 border-t border-emerald-500/20"
              >
                {[
                  { value: "500M+", label: "Farmers Globally" },
                  { value: "$1.2T", label: "Market Size" },
                  { value: "40%", label: "Yield Increase" },
                ].map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <p className="text-sm text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div variants={itemVariants} className="relative h-72 sm:h-80 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-emerald-500/20"></div>
              <div className="absolute inset-0 backdrop-blur-3xl"></div>
              <div className="absolute inset-0 border border-emerald-500/30 rounded-2xl"></div>

              {/* Glassmorphism card content */}
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-2xl neon-glow"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Leaf className="w-10 h-10 text-white" />
                </motion.div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-200">Advanced AI Analysis</p>
                  <p className="text-xs text-slate-400">Real-time crop monitoring</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-32 px-4 bg-slate-900/50 backdrop-blur-sm border-y border-emerald-500/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              AI + Satellite Imagery + IoT Sensors + Machine Learning
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Smartphone,
                title: "Real-time Monitoring",
                desc: "IoT sensors collect soil, weather, and plant health data 24/7",
              },
              {
                icon: Brain,
                title: "AI Analysis",
                desc: "Advanced ML models process data for actionable insights",
              },
              {
                icon: Zap,
                title: "Smart Recommendations",
                desc: "Get personalized farming advice powered by quantum AI",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-shadow"
              >
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Insights Section */}
      <section className="py-20 sm:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
              Smart Insights
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">AI-driven recommendations tailored to your farm</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Droplets,
                title: "Smart Irrigation",
                desc: "Optimize water usage with AI-powered irrigation scheduling",
              },
              {
                icon: Wind,
                title: "Weather Predictions",
                desc: "Advanced forecasting for crop protection and planning",
              },
              {
                icon: BarChart3,
                title: "Yield Forecasting",
                desc: "Predict harvest outcomes with machine learning models",
              },
              {
                icon: Globe,
                title: "Sustainability Metrics",
                desc: "Track carbon footprint and environmental impact",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-emerald-500/20 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 bg-gradient-to-r from-emerald-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8 relative z-10"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white">Ready to Transform Your Farm?</h2>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
            Join thousands of farmers using FarmGenius AI to grow smarter, not harder. Start your free analysis today.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white hover:bg-slate-100 text-emerald-600 shadow-xl hover:shadow-2xl font-semibold"
            >
              Try FarmGenius AI
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-500/20 py-12 bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-400">
          <p>&copy; 2025 AgriNova AI. Empowering sustainable agriculture with quantum-level AI.</p>
        </div>
      </footer>
    </div>
  )
}
