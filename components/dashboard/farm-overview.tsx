"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Droplets, Leaf, Trash2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase-client"
import Link from "next/link"

interface Farm {
  id: string
  name: string
  location: string
  size: number
  soilType: string
  crops?: number
}

export default function FarmOverview() {
  const { user } = useUser()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchFarms()
  }, [user])

  const fetchFarms = async () => {
    try {
      // Get the current Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        console.error("No valid session found")
        setLoading(false)
        return
      }

      const response = await fetch("/api/farms", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const mapped = (data.farms || []).map((f: any) => ({
          id: f.id,
          name: f.farm_name,
          location: f.location_address || [f.city, f.state].filter(Boolean).join(', '),
          size: f.total_area_hectares || 0,
          soilType: f.soil_type || 'Unknown',
          crops: f.crops_count || 0
        }))
        setFarms(mapped)
      } else {
        console.error("Failed to fetch farms:", response.status)
      }
    } catch (error) {
      console.error("Error fetching farms:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFarm = async (farmId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm("Are you sure you want to delete this farm? This will also delete all crops associated with it. This action cannot be undone.")) {
      return
    }

    setDeletingId(farmId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert("Session expired. Please login again.")
        return
      }

      const response = await fetch(`/api/farms/${farmId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        setFarms(farms.filter(f => f.id !== farmId))
        alert("Farm deleted successfully!")
      } else {
        const error = await response.json()
        alert(`Failed to delete farm: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error("Error deleting farm:", error)
      alert("Failed to delete farm. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Your Farms</h2>
      </div>

      {farms.length === 0 ? (
        <Card className="p-12 text-center border border-border/40">
          <Leaf className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No farms yet. Create your first farm to get started!</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {farms.map((farm) => (
            <Card
              key={farm.id}
              className="p-6 border border-border/40 hover:border-primary/40 transition-all hover:shadow-lg bg-linear-to-br from-card to-card/50 relative group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{farm.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    {farm.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{farm.size}</div>
                  <p className="text-xs text-muted-foreground">hectares</p>
                  <Link href={`/dashboard/farms/${farm.id}/edit`} className="text-xs text-primary underline">Edit</Link>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Crops</p>
                    <p className="font-semibold text-foreground">{farm.crops || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Soil</p>
                    <p className="font-semibold text-foreground text-sm">{farm.soilType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold text-green-600">Healthy</p>
                </div>
              </div>

              {/* Delete Button */}
              <Button
                onClick={(e) => handleDeleteFarm(farm.id, e)}
                disabled={deletingId === farm.id}
                className="absolute top-4 right-4 h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete farm"
              >
                {deletingId === farm.id ? (
                  <span className="text-xs">...</span>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
