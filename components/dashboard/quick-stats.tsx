"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Droplets, Leaf, TrendingUp, AlertCircle, AlertTriangle, Loader2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase-client"

interface Stat {
  label: string
  value: string
  icon: any
  color: string
  bgColor: string
}

export default function QuickStats() {
  const { user } = useUser()
  const [stats, setStats] = useState<Stat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.farmerId) return

    const fetchStats = async () => {
      try {
        // Get active crops with detailed information
        const { data: crops, count: cropCount, error: cropsError } = await supabase
          .from('crops')
          .select('*, farms(soil_type, total_area_hectares)', { count: 'exact' })
          .eq('farmer_id', user.farmerId)
          .eq('crop_status', 'active')

        console.log('Dashboard crops query:', { crops, cropCount, cropsError, farmerId: user.farmerId })

        // Calculate water recommendations and yield predictions
        let totalWaterRecommended = 0
        let totalYield = 0
        
        if (crops && crops.length > 0) {
          crops.forEach((crop: any) => {
            const area = crop.planted_area_hectares || 0
            const cropName = crop.crop_name?.toLowerCase() || ''
            const soilType = crop.farms?.soil_type?.toLowerCase() || 'loamy'
            
            // Calculate water recommendation based on crop type and soil
            let waterPerHectare = 500 // default mm per hectare
            
            // Adjust based on crop type
            if (cropName.includes('rice') || cropName.includes('paddy')) {
              waterPerHectare = 1200
            } else if (cropName.includes('wheat') || cropName.includes('barley')) {
              waterPerHectare = 450
            } else if (cropName.includes('corn') || cropName.includes('maize')) {
              waterPerHectare = 600
            } else if (cropName.includes('cotton')) {
              waterPerHectare = 700
            } else if (cropName.includes('sugarcane')) {
              waterPerHectare = 1500
            } else if (cropName.includes('potato') || cropName.includes('tomato')) {
              waterPerHectare = 500
            } else if (cropName.includes('soybean') || cropName.includes('pulses')) {
              waterPerHectare = 400
            }
            
            // Adjust based on soil type
            if (soilType.includes('sandy')) {
              waterPerHectare *= 1.2 // Sandy soil needs more water
            } else if (soilType.includes('clay')) {
              waterPerHectare *= 0.9 // Clay retains water better
            }
            
            totalWaterRecommended += waterPerHectare * area
            
            // Calculate predicted yield based on crop type
            let yieldPerHectare = 4.0 // default tonnes per hectare
            
            if (cropName.includes('rice') || cropName.includes('paddy')) {
              yieldPerHectare = 5.5
            } else if (cropName.includes('wheat')) {
              yieldPerHectare = 4.8
            } else if (cropName.includes('corn') || cropName.includes('maize')) {
              yieldPerHectare = 6.2
            } else if (cropName.includes('cotton')) {
              yieldPerHectare = 2.5
            } else if (cropName.includes('sugarcane')) {
              yieldPerHectare = 70.0
            } else if (cropName.includes('potato')) {
              yieldPerHectare = 25.0
            } else if (cropName.includes('tomato')) {
              yieldPerHectare = 35.0
            } else if (cropName.includes('soybean')) {
              yieldPerHectare = 3.2
            }
            
            totalYield += yieldPerHectare * area
          })
        }
        
        const avgYield = crops && crops.length > 0 ? totalYield / crops.length : 0

        // Farms count
        const { count: farmsCount } = await supabase
          .from('farms')
          .select('*', { count: 'exact', head: true })
          .eq('farmer_id', user.farmerId)

        const newStats: Stat[] = [
          {
            label: "Active Crops",
            value: cropCount?.toString() || "0",
            icon: Leaf,
            color: "text-green-600",
            bgColor: "bg-green-100",
          },
          {
            label: "Water Recommended",
            value: totalWaterRecommended > 0 ? `${Math.round(totalWaterRecommended)}mm` : "0mm",
            icon: Droplets,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          {
            label: "Predicted Yield",
            value: avgYield > 0 ? `${avgYield.toFixed(1)} t/ha` : "0.0 t/ha",
            icon: TrendingUp,
            color: "text-primary",
            bgColor: "bg-primary/10",
          },
          {
            label: "Farms",
            value: farmsCount?.toString() || "0",
            icon: AlertCircle,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
          },
        ]

        setStats(newStats)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        // Show default stats if there's an error
        setStats([
          {
            label: "Active Crops",
            value: "0",
            icon: Leaf,
            color: "text-green-600",
            bgColor: "bg-green-100",
          },
          {
            label: "Water Recommended",
            value: "0mm",
            icon: Droplets,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
          },
          {
            label: "Predicted Yield",
            value: "No data",
            icon: TrendingUp,
            color: "text-primary",
            bgColor: "bg-primary/10",
          },
          {
            label: "Active Alerts",
            value: "0",
            icon: AlertCircle,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user?.farmerId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 border border-border/40 animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="p-3 rounded-lg bg-gray-100">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon
        return (
          <Card key={idx} className="p-6 border border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
