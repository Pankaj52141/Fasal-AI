"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, Loader2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase-client"

interface Recommendation {
  id: string
  type: string
  priority: string
  title: string
  description: string
  action: string
  createdAt: string
}

export default function RecommendationsWidget() {
  const { user } = useUser()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.farmerId) return

    const fetchRecommendations = async () => {
      try {
        // Get farmer's crops with detailed information
        const { data: crops } = await supabase
          .from('crops')
          .select('id, crop_name, planted_area_hectares, planting_date, growth_stage, farms(soil_type, irrigation_type)')
          .eq('farmer_id', user.farmerId)
          .eq('crop_status', 'active')
          .limit(10)

        const cropIds = crops?.map(c => c.id) || []

        let aiRecommendations: Recommendation[] = []

        if (crops && crops.length > 0) {
          // Generate recommendations based on crop data
          crops.forEach((crop: any, index: number) => {
            if (index >= 3) return // Limit to 3 recommendations
            
            const cropName = crop.crop_name?.toLowerCase() || ''
            const area = crop.planted_area_hectares || 0
            const soilType = crop.farms?.soil_type?.toLowerCase() || 'loamy'
            const irrigationType = crop.farms?.irrigation_type?.toLowerCase() || 'traditional'
            
            // Calculate expected yield
            let yieldPerHectare = 4.0
            if (cropName.includes('rice')) yieldPerHectare = 5.5
            else if (cropName.includes('wheat')) yieldPerHectare = 4.8
            else if (cropName.includes('corn')) yieldPerHectare = 6.2
            else if (cropName.includes('potato')) yieldPerHectare = 25.0
            else if (cropName.includes('sugarcane')) yieldPerHectare = 70.0
            
            const expectedYield = (yieldPerHectare * area).toFixed(1)
            
            // Yield optimization recommendation
            aiRecommendations.push({
              id: `yield_${crop.id}`,
              type: 'yield',
              priority: 'high',
              title: `Optimize ${crop.crop_name} Yield`,
              description: `Expected yield: ${expectedYield} tonnes. Apply balanced NPK fertilizer (10:26:26) at vegetative stage to boost production by 15-20%.`,
              action: 'View Details',
              createdAt: new Date().toISOString()
            })
            
            // Irrigation recommendation
            if (!irrigationType.includes('drip') && !irrigationType.includes('sprinkler')) {
              aiRecommendations.push({
                id: `irrigation_${crop.id}`,
                type: 'water',
                priority: 'medium',
                title: 'Upgrade Irrigation System',
                description: `Consider drip or sprinkler irrigation for ${crop.crop_name}. Can save 30-50% water and increase yield by 10-15%.`,
                action: 'Learn More',
                createdAt: new Date().toISOString()
              })
            }
            
            // Soil-specific recommendation
            if (soilType.includes('sandy')) {
              aiRecommendations.push({
                id: `soil_${crop.id}`,
                type: 'soil',
                priority: 'medium',
                title: 'Improve Soil Water Retention',
                description: `Sandy soil detected. Add organic matter (compost) to improve water retention and reduce irrigation frequency by 20%.`,
                action: 'View Guide',
                createdAt: new Date().toISOString()
              })
            } else if (soilType.includes('clay')) {
              aiRecommendations.push({
                id: `soil_${crop.id}`,
                type: 'soil',
                priority: 'medium',
                title: 'Improve Soil Drainage',
                description: `Clay soil detected. Consider adding gypsum to improve drainage and prevent waterlogging for ${crop.crop_name}.`,
                action: 'View Guide',
                createdAt: new Date().toISOString()
              })
            }
          })

          // Check AI predictions for additional recommendations
          if (cropIds.length > 0) {
            const { data: predictions, error: predError } = await supabase
              .from('ai_predictions')
              .select('prediction_data, crop_id, created_at, prediction_type')
              .in('crop_id', cropIds)
              .order('created_at', { ascending: false })
              .limit(5)

            if (!predError && predictions && predictions.length > 0) {
              predictions.forEach(pred => {
                const crop = crops.find((c: any) => c.id === pred.crop_id)
                if (pred.prediction_data?.yieldPrediction && aiRecommendations.length < 3) {
                  const yieldValue = pred.prediction_data.yieldPrediction.expectedYield || pred.prediction_data.yieldPrediction.yieldPerHectare
                  aiRecommendations.push({
                    id: `ai_pred_${pred.crop_id}`,
                    type: 'prediction',
                    priority: 'high',
                    title: 'AI Yield Forecast Available',
                    description: `Predicted yield for ${crop?.crop_name}: ${yieldValue?.toFixed(1)} tonnes. Maintain current practices for optimal results.`,
                    action: 'View Forecast',
                    createdAt: pred.created_at
                  })
                }
              })
            }
          }
        }

        // Fallback recommendations if no data
        if (aiRecommendations.length === 0) {
          aiRecommendations = [
            {
              id: 'default_1',
              type: 'info',
              priority: 'medium',
              title: 'Add Your First Crop',
              description: 'Start tracking your crops to get AI-powered recommendations',
              action: 'Add Crop',
              createdAt: new Date().toISOString()
            }
          ]
        }

        // Sort by date and take top 3
        aiRecommendations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setRecommendations(aiRecommendations.slice(0, 3))

      } catch (error) {
        console.error('Error fetching recommendations:', error)
        // Fallback to sample data if no AI data available
        setRecommendations([
          {
            id: 'sample_1',
            type: 'info',
            priority: 'medium',
            title: 'Train Your AI Model',
            description: 'Upload your agricultural dataset and train AI models for personalized recommendations.',
            action: 'Get Started',
            createdAt: new Date().toISOString()
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [user?.farmerId])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-green-100 text-green-800"
    }
  }

  if (loading) {
    return (
      <Card className="p-6 border border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">AI Recommendations</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading AI insights...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border border-border/40">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Recommendations</h3>
        {recommendations.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {recommendations.length} active
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-4 rounded-lg border border-border/40 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-foreground">{rec.title}</h4>
              <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
            <button className="text-sm font-medium text-primary hover:text-primary/80 transition">
              {rec.action} →
            </button>
          </div>
        ))}
      </div>
    </Card>
  )
}
