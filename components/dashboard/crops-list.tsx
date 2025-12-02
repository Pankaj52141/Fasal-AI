"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, AlertCircle, Trash2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase-client"

interface Crop {
  id: string
  crop_name: string
  planting_date: string
  planted_area_hectares?: number
  growth_stage?: string
  notes?: string
}

export default function CropsList() {
  const { user } = useUser()
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchCrops = async () => {
      try {
        const { data, error } = await supabase
          .from('crops')
          .select('id, crop_name, planting_date, planted_area_hectares, growth_stage, notes')
          .eq('farmer_id', user.farmerId)
          .eq('crop_status', 'active')
          .order('planting_date', { ascending: false })

        if (error) {
          console.error('Error fetching crops:', error)
        } else {
          setCrops(data || [])
        }
      } catch (error) {
        console.error('Error fetching crops:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCrops()
  }, [user])

  const handleDeleteCrop = async (cropId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm("Are you sure you want to delete this crop? This action cannot be undone.")) {
      return
    }

    setDeletingId(cropId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert("Session expired. Please login again.")
        return
      }

      const response = await fetch(`/api/crops/${cropId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        setCrops(crops.filter(c => c.id !== cropId))
        alert("Crop deleted successfully!")
      } else {
        const error = await response.json()
        alert(`Failed to delete crop: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error deleting crop:", error)
      alert("Failed to delete crop. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "Healthy":
        return "bg-green-100 text-green-800"
      case "At Risk":
        return "bg-yellow-100 text-yellow-800"
      case "Diseased":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Active Crops</h2>
        <p className="text-muted-foreground">Loading crops...</p>
      </div>
    )
  }

  if (crops.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Active Crops</h2>
        <Card className="p-6 border border-border/40">
          <p className="text-muted-foreground">No crops yet. Add your first crop to start tracking!</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Active Crops ({crops.length})</h2>

      <div className="grid gap-4">
        {crops.map((crop) => (
          <Card key={crop.id} className="p-6 border border-border/40 hover:border-primary/40 transition-colors relative group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{crop.crop_name}</h3>
                <p className="text-sm text-muted-foreground">{crop.notes || 'Not specified'}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border/40">
              <div>
                <p className="text-xs text-muted-foreground">Growth Stage</p>
                <p className="font-semibold text-foreground">{crop.growth_stage || 'Tracking'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Planted</p>
                <p className="font-semibold text-foreground text-sm">{new Date(crop.planting_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Area</p>
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-foreground">{crop.planted_area_hectares || 0} ha</p>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <Button
              onClick={(e) => handleDeleteCrop(crop.id, e)}
              disabled={deletingId === crop.id}
              className="absolute top-4 right-4 h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Delete crop"
            >
              {deletingId === crop.id ? (
                <span className="text-xs">...</span>
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
