"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Leaf, Plus, BarChart3, MessageSquare } from "lucide-react"
import Link from "next/link"
import DashboardHeader from "@/components/dashboard/header"
import FarmOverview from "@/components/dashboard/farm-overview"
import CropsList from "@/components/dashboard/crops-list"
import QuickStats from "@/components/dashboard/quick-stats"
import AlertsWidget from "@/components/dashboard/alerts-widget"
import WeatherWidget from "@/components/dashboard/weather-widget"
import RecommendationsWidget from "@/components/dashboard/recommendations-widget"
import SustainabilityWidget from "@/components/dashboard/sustainability-widget"
import AnalyzeWidget from "@/components/dashboard/analyze-widget"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase-client"

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [totalFarmSize, setTotalFarmSize] = useState<number>(0)
  const [loadingFarmSize, setLoadingFarmSize] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user?.farmerId) return

    const fetchTotalFarmSize = async () => {
      try {
        const { data: farms } = await supabase
          .from('farms')
          .select('total_area_hectares')
          .eq('farmer_id', user.farmerId)

        if (farms && farms.length > 0) {
          const total = farms.reduce((sum, farm) => sum + (farm.total_area_hectares || 0), 0)
          setTotalFarmSize(total)
        }
      } catch (error) {
        console.error('Error fetching farm size:', error)
      } finally {
        setLoadingFarmSize(false)
      }
    }

    fetchTotalFarmSize()
  }, [user?.farmerId])

  const handleLogout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear localStorage (for backward compatibility)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
            <Leaf className="w-6 h-6 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dashboard-grid" x="100" y="100" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="2" fill="rgba(16, 185, 129, 0.3)" />
              <line x1="50" y1="50" x2="100" y2="50" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.5" />
              <line x1="50" y1="50" x2="50" y2="100" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dashboard-grid)" />
        </svg>
      </div>

      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 rounded-lg p-6 border border-emerald-500/30 mb-6 backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-foreground mb-2 glow-text">Welcome back, {user?.fullName}!</h1>
            <p className="text-muted-foreground">Manage your farms and crops with AI-powered insights</p>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Left Column - Farms & Crops */}
          <div className="lg:col-span-2 space-y-8">
            <FarmOverview />
            <CropsList />
            {/* Analyze Widget for image/sound upload and analysis */}
            <AnalyzeWidget />
          </div>

          {/* Right Column - Widgets */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6 border border-emerald-500/20 bg-slate-900/40 backdrop-blur-sm hover:border-emerald-500/40 transition-all">
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/dashboard/add-farm" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent text-emerald-400 hover:text-emerald-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Farm
                  </Button>
                </Link>
                <Link href="/dashboard/add-crop" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent text-emerald-400 hover:text-emerald-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Crop
                  </Button>
                </Link>
                <Link href="/dashboard/analytics" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent text-emerald-400 hover:text-emerald-300"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Link href="/dashboard/chat" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent text-emerald-400 hover:text-emerald-300"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    AI Assistant
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Farm Size Card */}
            <Card className="p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 backdrop-blur-sm">
              <h3 className="font-semibold text-foreground mb-2">Farm Size</h3>
              <p className="text-2xl font-bold text-emerald-400 mb-2">
                {loadingFarmSize ? "..." : totalFarmSize > 0 ? `${totalFarmSize.toFixed(1)} ha` : "Not set"}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalFarmSize > 0 ? "Total farm area" : "Add your farm details"}
              </p>
              {user?.farmerId && (
                <p className="text-xs text-emerald-300 mt-1">Farmer ID: {user.farmerId}</p>
              )}
            </Card>

            <SustainabilityWidget />
          </div>
        </div>

        {/* Bottom Widgets */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          <AlertsWidget />
          <WeatherWidget />
          <RecommendationsWidget />
        </div>
      </main>
    </div>
  )
}
