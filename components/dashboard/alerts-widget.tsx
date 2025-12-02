"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase-client"

interface Alert {
  id: string
  type: string
  title: string
  message: string
  crop?: string
  time: string
  priority?: string
}

export default function AlertsWidget() {
  const { user } = useUser()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.farmerId) return

    const fetchAlerts = async () => {
      try {
        const processedAlerts: Alert[] = []

        // Get farmer's crops with detailed information
        const { data: crops } = await supabase
          .from('crops')
          .select('id, crop_name, planted_area_hectares, planting_date, growth_stage, health_status, farms(soil_type)')
          .eq('farmer_id', user.farmerId)
          .eq('crop_status', 'active')
          .limit(10)

        const cropIds = crops?.map(c => c.id) || []

        if (crops && crops.length > 0) {
          // Generate alerts based on crop data
          crops.forEach((crop: any) => {
            const cropName = crop.crop_name?.toLowerCase() || ''
            const area = crop.planted_area_hectares || 0
            const plantingDate = new Date(crop.planting_date)
            const daysSincePlanting = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24))
            
            // Water requirement alerts
            let waterPerHectare = 500
            if (cropName.includes('rice')) waterPerHectare = 1200
            else if (cropName.includes('wheat')) waterPerHectare = 450
            else if (cropName.includes('corn')) waterPerHectare = 600
            else if (cropName.includes('sugarcane')) waterPerHectare = 1500
            
            const totalWater = waterPerHectare * area
            if (totalWater > 5000) {
              processedAlerts.push({
                id: `water_${crop.id}`,
                type: 'warning',
                title: 'High Water Requirement',
                message: `${crop.crop_name} needs approximately ${Math.round(totalWater)}mm of water. Consider efficient irrigation methods.`,
                crop: crop.crop_name,
                time: 'Now',
                priority: 'high'
              })
            }
            
            // Growth stage alerts
            if (daysSincePlanting > 30 && daysSincePlanting < 90) {
              processedAlerts.push({
                id: `growth_${crop.id}`,
                type: 'info',
                title: 'Active Growth Phase',
                message: `${crop.crop_name} is in critical growth phase. Monitor nutrient levels and water supply regularly.`,
                crop: crop.crop_name,
                time: `Day ${daysSincePlanting}`,
                priority: 'medium'
              })
            }
            
            // Harvest timing alert
            const expectedHarvestDays = cropName.includes('rice') ? 120 : cropName.includes('wheat') ? 120 : 90
            if (daysSincePlanting > expectedHarvestDays - 15 && daysSincePlanting < expectedHarvestDays) {
              processedAlerts.push({
                id: `harvest_${crop.id}`,
                type: 'info',
                title: 'Harvest Approaching',
                message: `${crop.crop_name} is nearing harvest time. Prepare equipment and labor in advance.`,
                crop: crop.crop_name,
                time: `${expectedHarvestDays - daysSincePlanting} days left`,
                priority: 'high'
              })
            }
          })

          // Check AI predictions for additional alerts
          if (cropIds.length > 0) {
            const { data: predictions, error: predError } = await supabase
              .from('ai_predictions')
              .select('prediction_data, crop_id, created_at')
              .in('crop_id', cropIds)
              .order('created_at', { ascending: false })
              .limit(5)

            if (!predError && predictions && predictions.length > 0) {
              predictions.forEach(pred => {
                const crop = crops.find((c: any) => c.id === pred.crop_id)
                if (pred.prediction_data?.waterRecommendation) {
                  processedAlerts.push({
                    id: `ai_water_${pred.crop_id}`,
                    type: 'info',
                    title: 'Irrigation Recommendation',
                    message: `Apply ${Math.round(pred.prediction_data.waterRecommendation.totalWater)}mm water to ${crop?.crop_name || 'crop'}`,
                    crop: crop?.crop_name,
                    time: formatTime(pred.created_at),
                    priority: 'medium'
                  })
                }
              })
            }
          }
        }

        // Fallback if no alerts
        if (processedAlerts.length === 0) {
          processedAlerts.push({
            id: 'default_1',
            type: 'success',
            title: 'All Systems Normal',
            message: 'No alerts at this time. Your crops are being monitored.',
            time: 'Just now'
          })
        }

        // Sort by priority and recency
        processedAlerts.sort((a, b) => {
          const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 }
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1
          return bPriority - aPriority
        })

        setAlerts(processedAlerts.slice(0, 3))

      } catch (error) {
        console.error('Error fetching alerts:', error)
        // Fallback message
        setAlerts([
          {
            id: 'sample_1',
            type: 'info',
            title: 'AI Model Ready',
            message: 'Connect your trained AI model to start receiving real-time crop alerts and recommendations.',
            time: 'Now',
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [user?.farmerId])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <Card className="p-6 border border-border/40">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Alerts</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading alerts...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border border-border/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">AI Alerts</h3>
        {alerts.length > 0 && (
          <Badge variant={alerts.some(a => a.type === 'warning') ? 'destructive' : 'secondary'}>
            {alerts.length} alerts
          </Badge>
        )}
      </div>
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex gap-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex-shrink-0">{getAlertIcon(alert.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{alert.title}</p>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{alert.crop}</p>
            </div>
            <div className="text-xs text-muted-foreground text-right flex-shrink-0">{alert.time}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
