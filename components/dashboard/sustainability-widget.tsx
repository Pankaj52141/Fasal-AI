"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Leaf, Droplets, Wind, Sprout, Loader2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase-client"

interface SustainabilityData {
  overallScore: number
  carbonOffset: number
  waterSaved: number
  soilHealth: string
  biodiversity: string
}

export default function SustainabilityWidget() {
  const { user } = useUser()
  const [sustainabilityData, setSustainabilityData] = useState<SustainabilityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.farmerId) return

    const fetchSustainabilityData = async () => {
      try {
        // Get user's crops with farm details
        const { data: crops } = await supabase
          .from('crops')
          .select('*, farms(soil_type, total_area_hectares, irrigation_type)')
          .eq('farmer_id', user.farmerId)
          .eq('crop_status', 'active')

        // If no crops, return null to show "no data" message
        if (!crops || crops.length === 0) {
          setSustainabilityData(null)
          setLoading(false)
          return
        }

        const cropIds = crops?.map(c => c.id) || []

        let overallScore = 40 // Base score
        let carbonOffset = 0
        let waterSaved = 0
        let soilHealth = "Fair"
        let biodiversity = "Low"

        // Calculate based on real crop data
        let totalArea = 0
        let organicCrops = 0
        let efficientIrrigation = 0
        let diverseCrops = new Set()
        
        crops.forEach((crop: any) => {
          const area = crop.planted_area_hectares || 0
          totalArea += area
          
          const cropName = crop.crop_name?.toLowerCase() || ''
          diverseCrops.add(cropName)
          
          // Check for organic/sustainable practices
          const healthStatus = crop.health_status?.toLowerCase() || 'healthy'
          if (healthStatus === 'healthy' || healthStatus === 'excellent') {
            organicCrops++
          }
          
          // Check irrigation type
          const irrigationType = crop.farms?.irrigation_type?.toLowerCase() || ''
          if (irrigationType.includes('drip') || irrigationType.includes('sprinkler')) {
            efficientIrrigation++
          }
        })
        
        // Calculate carbon offset (based on area and crop type)
        // Average carbon sequestration: 2-4 tons CO2/hectare/year for crops
        carbonOffset = Math.round(totalArea * 2.5 * 10) / 10
        
        // Calculate water saved (efficient irrigation saves 30-50% water)
        const irrigationEfficiency = crops.length > 0 ? (efficientIrrigation / crops.length) : 0
        waterSaved = Math.round(irrigationEfficiency * 40) + 10 // Base 10% savings
        
        // Calculate soil health based on crop diversity and health
        const healthyRatio = crops.length > 0 ? (organicCrops / crops.length) : 0.5
        const diversityScore = Math.min(diverseCrops.size / 3, 1) // More diverse = better
        
        if (healthyRatio > 0.8 && diversityScore > 0.6) {
          soilHealth = "Excellent"
        } else if (healthyRatio > 0.6 || diversityScore > 0.4) {
          soilHealth = "Good"
        } else {
          soilHealth = "Fair"
        }
        
        // Calculate biodiversity based on crop diversity
        if (diverseCrops.size >= 4) {
          biodiversity = "High"
        } else if (diverseCrops.size >= 2) {
          biodiversity = "Medium"
        } else {
          biodiversity = "Low"
        }
        
        // Calculate overall score
        overallScore = Math.min(100, Math.round(
          40 + // Base score
            (healthyRatio * 30) + // Crop health contribution
            (diversityScore * 20) + // Diversity contribution
            (irrigationEfficiency * 10) // Efficiency contribution
        ))

        // Try to get AI predictions for additional insights
        if (cropIds.length > 0) {
          const { data: cropPredictions, error: predError } = await supabase
            .from('ai_predictions')
            .select('prediction_data, created_at')
            .in('crop_id', cropIds)
            .in('prediction_type', ['crop_health', 'yield_forecast'])
            .order('created_at', { ascending: false })
            .limit(10)

          if (!predError && cropPredictions && cropPredictions.length > 0) {
            let healthyPredictions = 0
            cropPredictions.forEach(prediction => {
              if (prediction.prediction_data?.healthStatus === 'healthy' || 
                  prediction.prediction_data?.overallHealth?.status === 'healthy') {
                healthyPredictions++
              }
            })
            
            // Adjust score based on predictions
            const predictionBonus = Math.round((healthyPredictions / cropPredictions.length) * 10)
            overallScore = Math.min(100, overallScore + predictionBonus)
          }
        }

        setSustainabilityData({
          overallScore,
          carbonOffset,
          waterSaved,
          soilHealth,
          biodiversity
        })
      } catch (error) {
        console.error('Error fetching sustainability data:', error)
        setSustainabilityData({
          overallScore: 0,
          carbonOffset: 0,
          waterSaved: 0,
          soilHealth: "No data",
          biodiversity: "No data"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSustainabilityData()
  }, [user?.farmerId])

  if (loading) {
    return (
      <Card className="p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 backdrop-blur-sm">
        <h3 className="font-semibold text-foreground mb-4">Sustainability Score</h3>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      </Card>
    )
  }

  if (!sustainabilityData) {
    return (
      <Card className="p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 backdrop-blur-sm">
        <h3 className="font-semibold text-foreground mb-4">Sustainability Score</h3>
        <div className="text-center py-8 text-muted-foreground">
          <Sprout className="w-12 h-12 mx-auto mb-3 text-emerald-400/50" />
          <p className="font-medium text-foreground mb-1">No Data Available</p>
          <p className="text-sm">Add farms and crops to see sustainability metrics</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 backdrop-blur-sm">
      <h3 className="font-semibold text-foreground mb-4">Sustainability Score</h3>

      {/* Main Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Overall Score</span>
          <span className="text-2xl font-bold text-emerald-400">
            {sustainabilityData.overallScore}/100
          </span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2 rounded-full" 
            style={{ width: `${sustainabilityData.overallScore}%` }} 
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-3">
        {/* Carbon Offset */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-emerald-500/10">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Carbon Offset</span>
          </div>
          <span className="text-sm font-semibold text-emerald-400">
            {sustainabilityData.carbonOffset} tons
          </span>
        </div>

        {/* Water Conservation */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-cyan-500/10">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-muted-foreground">Water Saved</span>
          </div>
          <span className="text-sm font-semibold text-cyan-400">
            {sustainabilityData.waterSaved}%
          </span>
        </div>

        {/* Soil Health */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-emerald-500/10">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Soil Health</span>
          </div>
          <span className="text-sm font-semibold text-emerald-400">
            {sustainabilityData.soilHealth}
          </span>
        </div>

        {/* Biodiversity */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-cyan-500/10">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-muted-foreground">Biodiversity</span>
          </div>
          <span className="text-sm font-semibold text-cyan-400">
            {sustainabilityData.biodiversity}
          </span>
        </div>
      </div>
    </Card>
  )
}
