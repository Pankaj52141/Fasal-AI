"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit2, Trash2, TrendingUp } from "lucide-react"
import Link from "next/link"
import DashboardHeader from "@/components/dashboard/header"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useUser } from "@/lib/user-context"

export default function CropDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading } = useUser()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase-client')
    await supabase.auth.signOut()
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Mock crop data
  const crop = {
    id: params.id,
    name: "Wheat",
    variety: "HD 2967",
    farm: "North Field",
    area: 15,
    plantingDate: "2024-10-01",
    expectedHarvestDate: "2025-02-15",
    growthStage: "Vegetative",
    healthStatus: "Healthy",
    estimatedYield: "8.5 tons/ha",
  }

  const healthData = [
    { day: "Day 1", score: 75 },
    { day: "Day 5", score: 78 },
    { day: "Day 10", score: 82 },
    { day: "Day 15", score: 85 },
    { day: "Day 20", score: 87 },
    { day: "Day 25", score: 89 },
  ]

  const sensorData = [
    { time: "6 AM", moisture: 55, temp: 18, humidity: 70 },
    { time: "12 PM", moisture: 48, temp: 28, humidity: 55 },
    { time: "6 PM", moisture: 52, temp: 24, humidity: 65 },
    { time: "12 AM", moisture: 58, temp: 20, humidity: 75 },
  ]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-primary hover:text-primary/80">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{crop.name}</h1>
              <p className="text-muted-foreground">
                {crop.farm} • {crop.variety}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-border hover:bg-accent/5 bg-transparent">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="border-border hover:bg-accent/5 text-destructive bg-transparent">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border border-border/40">
            <p className="text-sm text-muted-foreground mb-1">Growth Stage</p>
            <p className="text-2xl font-bold text-foreground">{crop.growthStage}</p>
          </Card>
          <Card className="p-6 border border-border/40">
            <p className="text-sm text-muted-foreground mb-1">Health Status</p>
            <Badge className="bg-green-100 text-green-800">{crop.healthStatus}</Badge>
          </Card>
          <Card className="p-6 border border-border/40">
            <p className="text-sm text-muted-foreground mb-1">Area</p>
            <p className="text-2xl font-bold text-foreground">{crop.area} ha</p>
          </Card>
          <Card className="p-6 border border-border/40">
            <p className="text-sm text-muted-foreground mb-1">Est. Yield</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-5 h-5 text-primary" />
              <p className="text-2xl font-bold text-foreground">{crop.estimatedYield}</p>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Health Score Trend */}
          <Card className="p-6 border border-border/40">
            <h2 className="text-xl font-semibold text-foreground mb-4">Health Score Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Sensor Data */}
          <Card className="p-6 border border-border/40">
            <h2 className="text-xl font-semibold text-foreground mb-4">Soil Moisture (24h)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="moisture" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 border border-border/40">
            <h3 className="text-lg font-semibold text-foreground mb-4">Crop Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variety</span>
                <span className="font-medium text-foreground">{crop.variety}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Planting Date</span>
                <span className="font-medium text-foreground">{crop.plantingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Harvest</span>
                <span className="font-medium text-foreground">{crop.expectedHarvestDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days to Harvest</span>
                <span className="font-medium text-foreground">45 days</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-border/40">
            <h3 className="text-lg font-semibold text-foreground mb-4">Current Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Soil Moisture</span>
                <span className="font-medium text-foreground">52%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Temperature</span>
                <span className="font-medium text-foreground">24°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Humidity</span>
                <span className="font-medium text-foreground">65%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nitrogen Level</span>
                <span className="font-medium text-foreground">35 mg/kg</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
