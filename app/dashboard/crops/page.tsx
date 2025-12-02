"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import DashboardHeader from "@/components/dashboard/header"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase-client"

interface Crop {
  id: string
  name: string
  farm: string
  stage: string
  health: string
  yield: string
  plantingDate: string
  area: number
}

export default function CropsPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [searchTerm, setSearchTerm] = useState("")
  const [crops, setCrops] = useState<Crop[]>([])
  const [loadingCrops, setLoadingCrops] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    if (user?.farmerId) {
      fetchCrops()
    }
  }, [user, loading, router])

  const fetchCrops = async () => {
    if (!user?.farmerId) return
    
    try {
      const { data, error } = await supabase
        .from('crops')
        .select(`
          id,
          crop_name,
          planted_area_hectares,
          planting_date,
          crop_status,
          farms (
            farm_name
          )
        `)
        .eq('farmer_id', user.farmerId)
        .order('planting_date', { ascending: false })

      if (error) throw error

      const mapped = (data || []).map((c: any) => {
        const plantingDate = new Date(c.planting_date)
        const daysOld = Math.floor((Date.now() - plantingDate.getTime()) / (1000 * 60 * 60 * 24))
        
        let stage = "Seedling"
        if (daysOld > 90) stage = "Fruiting"
        else if (daysOld > 30) stage = "Vegetative"
        else if (daysOld > 60) stage = "Flowering"

        const health = c.crop_status === 'healthy' ? 'Healthy' : 
                      c.crop_status === 'at_risk' ? 'At Risk' : 'Diseased'

        // Calculate yield based on crop type
        const cropName = c.crop_name?.toLowerCase() || ''
        let yieldPerHa = 5.0
        if (cropName.includes('rice') || cropName.includes('paddy')) yieldPerHa = 5.5
        else if (cropName.includes('wheat')) yieldPerHa = 4.8
        else if (cropName.includes('corn') || cropName.includes('maize')) yieldPerHa = 6.2
        else if (cropName.includes('cotton')) yieldPerHa = 2.5
        else if (cropName.includes('sugarcane')) yieldPerHa = 70.0
        else if (cropName.includes('potato')) yieldPerHa = 25.0
        else if (cropName.includes('tomato')) yieldPerHa = 35.0

        return {
          id: c.id,
          name: c.crop_name || 'Unknown',
          farm: c.farms?.farm_name || 'Unknown',
          stage,
          health,
          yield: `${yieldPerHa.toFixed(1)} tons/ha`,
          plantingDate: c.planting_date,
          area: c.planted_area_hectares || 0
        }
      })

      setCrops(mapped)
    } catch (error) {
      console.error("Error fetching crops:", error)
    } finally {
      setLoadingCrops(false)
    }
  }

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

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase-client')
    await supabase.auth.signOut()
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  const filteredCrops = crops.filter(
    (crop) =>
      crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crop.farm.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  if (loading || loadingCrops) {
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Crops</h1>
            <p className="text-muted-foreground">Manage and monitor all your crops</p>
          </div>
          <Link href="/dashboard/add-crop">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add Crop
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <label htmlFor="search-crops" className="sr-only">
            Search crops or farms
          </label>
          <Input
            id="search-crops"
            name="search"
            type="text"
            placeholder="Search crops or farms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Crops Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <div key={crop.id} className="relative group">
              <Link href={`/dashboard/crops/${crop.id}`}>
                <Card className="p-6 border border-border/40 hover:border-primary/40 transition-colors cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{crop.name}</h3>
                      <p className="text-sm text-muted-foreground">{crop.farm}</p>
                    </div>
                    <Badge className={getHealthColor(crop.health)}>{crop.health}</Badge>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border/40">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Growth Stage</span>
                      <span className="font-medium text-foreground">{crop.stage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Area</span>
                      <span className="font-medium text-foreground">{crop.area} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Est. Yield</span>
                      <span className="font-medium text-foreground">{crop.yield}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Planted</span>
                      <span className="font-medium text-foreground text-sm">{crop.plantingDate}</span>
                    </div>
                  </div>
                </Card>
              </Link>
              
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
            </div>
          ))}
        </div>

        {filteredCrops.length === 0 && (
          <Card className="p-12 border border-border/40 text-center">
            <p className="text-muted-foreground mb-4">No crops found matching your search</p>
            <Link href="/dashboard/add-crop">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Crop
              </Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  )
}
