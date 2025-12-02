"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, TrendingUp, Droplets, Leaf } from "lucide-react"
import DashboardHeader from "@/components/dashboard/header"
import { useUser } from "@/lib/user-context"

export default function PredictionsPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [predictions, setPredictions] = useState<any>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    // Mock predictions
    setPredictions({
      yieldForecast: {
        value: 8.5,
        confidence: 0.87,
        trend: "increasing",
      },
      diseaseRisk: {
        level: "low",
        confidence: 0.92,
      },
      irrigationSchedule: {
        nextWatering: "2024-12-15",
        amount: 50,
      },
    })
  }, [router])

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">AI Predictions</h1>
          <p className="text-muted-foreground">Machine learning forecasts for your crops</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Yield Forecast */}
          <Card className="p-6 border border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Yield Forecast</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Predicted Yield</p>
                <p className="text-3xl font-bold text-primary">8.5 t/ha</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-100 text-green-800">Increasing</Badge>
                  <span className="text-sm text-muted-foreground">87% confidence</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Positive Factors</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Optimal soil moisture</li>
                  <li>✓ Good nutrient levels</li>
                  <li>✓ Healthy growth stage</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Risk Factors</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>⚠ Slight humidity risk</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Disease Risk */}
          <Card className="p-6 border border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-semibold text-foreground">Disease Risk Assessment</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">Overall Risk Level</p>
                <p className="text-2xl font-bold text-green-600">Low</p>
                <span className="text-sm text-muted-foreground">92% confidence</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded border border-border/40">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">Powdery Mildew</span>
                    <span className="text-sm text-muted-foreground">15% risk</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Monitor humidity levels</p>
                </div>
                <div className="p-3 rounded border border-border/40">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-foreground">Leaf Spot</span>
                    <span className="text-sm text-muted-foreground">8% risk</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Ensure proper drainage</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Irrigation Schedule */}
          <Card className="p-6 border border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <Droplets className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-foreground">Irrigation Schedule</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-muted-foreground mb-1">Next Watering</p>
                <p className="text-2xl font-bold text-blue-600">2024-12-15</p>
                <p className="text-sm text-muted-foreground mt-1">Amount: 50mm</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">Frequency</p>
                <p className="text-sm text-muted-foreground">Every 3 days</p>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Schedule Irrigation</Button>
            </div>
          </Card>

          {/* Fertilizer Needs */}
          <Card className="p-6 border border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <Leaf className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-foreground">Fertilizer Recommendations</h2>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded border border-border/40">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-foreground">Nitrogen</span>
                  <span className="text-sm text-muted-foreground">35 → 40 mg/kg</span>
                </div>
                <p className="text-xs text-muted-foreground">Apply 10kg/ha</p>
              </div>
              <div className="p-3 rounded border border-border/40">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-foreground">Phosphorus</span>
                  <span className="text-sm text-muted-foreground">28 → 30 mg/kg</span>
                </div>
                <p className="text-xs text-muted-foreground">Apply 5kg/ha</p>
              </div>
              <div className="p-3 rounded border border-border/40">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-foreground">Potassium</span>
                  <span className="text-sm text-muted-foreground">32 → 35 mg/kg</span>
                </div>
                <p className="text-xs text-muted-foreground">Apply 8kg/ha</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
