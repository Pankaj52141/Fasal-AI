"use client"

import type React from "react"
import { supabase } from "@/lib/supabase-client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import DashboardHeader from "@/components/dashboard/header"
import { useUser } from "@/lib/user-context"

export default function AddCropPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [formData, setFormData] = useState({
    name: "",
    variety: "",
    area: "",
    plantingDate: "",
    farmId: "", // selected farm id
  })
  const [farms, setFarms] = useState<any[]>([])
  const [farmsLoading, setFarmsLoading] = useState(false)
  const [farmError, setFarmError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    const loadFarms = async () => {
      if (!user?.farmerId) return
      setFarmsLoading(true)
      const { data, error } = await supabase
        .from('farms')
        .select('id, farm_name')
        .eq('farmer_id', user.farmerId)
        .order('created_at', { ascending: true })
      if (error) {
        console.error('Error loading farms', error)
        setFarmError('Failed to load farms')
      } else {
        setFarms(data || [])
        if (data && data.length === 0) {
          setFarmError('No farms found. Create a farm before adding crops.')
        }
      }
      setFarmsLoading(false)
    }
    loadFarms()
  }, [user, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (!user.farmerId) {
        alert('You do not have a farmer_id profile yet. Create a farm first.')
        return
      }
      if (!formData.farmId) {
        alert('Select a farm. If none exist create a farm first.')
        return
      }
      const selectedFarm = farms.find(f => f.id === formData.farmId)
      if (!selectedFarm) {
        alert('Selected farm does not exist. Refresh the page.')
        return
      }
      
      // Insert crop and get the crop ID
      const { data: cropData, error } = await supabase
        .from('crops')
        .insert([
          {
            crop_name: formData.name,
            crop_variety: formData.variety,
            planted_area_hectares: parseFloat(formData.area),
            planting_date: formData.plantingDate,
            farmer_id: user.farmerId,
            farm_id: formData.farmId,
            crop_status: 'active',
            notes: selectedFarm.farm_name
          },
        ])
        .select()
        .single()

      if (error) {
        alert('Error adding crop: ' + error.message)
        return
      }
      
      // Generate initial AI predictions for the new crop
      if (cropData) {
        try {
          // Get farm details for soil type
          const { data: farmData } = await supabase
            .from('farms')
            .select('soil_type, total_area_hectares')
            .eq('id', formData.farmId)
            .single()
          
          const cropName = formData.name.toLowerCase()
          const area = parseFloat(formData.area)
          const soilType = farmData?.soil_type?.toLowerCase() || 'loamy'
          
          // Calculate yield prediction
          let yieldPerHectare = 4.0
          if (cropName.includes('rice') || cropName.includes('paddy')) yieldPerHectare = 5.5
          else if (cropName.includes('wheat')) yieldPerHectare = 4.8
          else if (cropName.includes('corn') || cropName.includes('maize')) yieldPerHectare = 6.2
          else if (cropName.includes('cotton')) yieldPerHectare = 2.5
          else if (cropName.includes('sugarcane')) yieldPerHectare = 70.0
          else if (cropName.includes('potato')) yieldPerHectare = 25.0
          else if (cropName.includes('tomato')) yieldPerHectare = 35.0
          else if (cropName.includes('soybean')) yieldPerHectare = 3.2
          
          const totalYield = yieldPerHectare * area
          
          // Calculate water recommendation
          let waterPerHectare = 500
          if (cropName.includes('rice') || cropName.includes('paddy')) waterPerHectare = 1200
          else if (cropName.includes('wheat')) waterPerHectare = 450
          else if (cropName.includes('corn') || cropName.includes('maize')) waterPerHectare = 600
          else if (cropName.includes('cotton')) waterPerHectare = 700
          else if (cropName.includes('sugarcane')) waterPerHectare = 1500
          else if (cropName.includes('potato') || cropName.includes('tomato')) waterPerHectare = 500
          else if (cropName.includes('soybean')) waterPerHectare = 400
          
          if (soilType.includes('sandy')) waterPerHectare *= 1.2
          else if (soilType.includes('clay')) waterPerHectare *= 0.9
          
          const totalWater = waterPerHectare * area
          
          // Store yield prediction
          await supabase.from('ai_predictions').insert([
            {
              crop_id: cropData.id,
              prediction_type: 'yield_forecast',
              prediction_data: {
                yieldPrediction: {
                  expectedYield: totalYield,
                  yieldPerHectare: yieldPerHectare,
                  unit: 'tonnes',
                  confidence: 0.85,
                  harvestDate: new Date(new Date(formData.plantingDate).getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                },
                factors: {
                  area: area,
                  cropType: formData.name,
                  soilType: soilType
                }
              },
              confidence_score: 0.85
            }
          ])
          
          // Store water recommendation
          await supabase.from('ai_predictions').insert([
            {
              crop_id: cropData.id,
              prediction_type: 'irrigation',
              prediction_data: {
                waterRecommendation: {
                  totalWater: totalWater,
                  waterPerHectare: waterPerHectare,
                  unit: 'mm',
                  frequency: 'Weekly',
                  confidence: 0.88
                },
                factors: {
                  area: area,
                  cropType: formData.name,
                  soilType: soilType
                }
              },
              confidence_score: 0.88
            }
          ])
        } catch (predError) {
          console.error('Error generating predictions:', predError)
          // Don't fail the crop creation if predictions fail
        }
      }
      
      router.push('/dashboard')
    } catch (err) {
      alert('Unexpected error adding crop')
    }
  }

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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Card className="p-8 border border-border/40">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add New Crop</h1>
          <p className="text-muted-foreground mb-8">Register a new crop to start monitoring</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="cropName" className="text-sm font-medium text-foreground">
                Crop Name
              </label>
              <Input
                id="cropName"
                type="text"
                name="name"
                placeholder="e.g., Wheat"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="variety" className="text-sm font-medium text-foreground">
                Variety
              </label>
              <Input
                id="variety"
                type="text"
                name="variety"
                placeholder="e.g., HD 2967"
                value={formData.variety}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="farmId" className="text-sm font-medium text-foreground">
                Farm
              </label>
              {farmsLoading ? (
                <p className="text-sm text-muted-foreground">Loading farms...</p>
              ) : farmError ? (
                <p className="text-sm text-red-500">{farmError}</p>
              ) : (
                <select
                  id="farmId"
                  name="farmId"
                  value={formData.farmId}
                  onChange={handleChange}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select a farm</option>
                  {farms.map(f => (
                    <option key={f.id} value={f.id}>{f.farm_name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="area" className="text-sm font-medium text-foreground">
                Area (hectares)
              </label>
              <Input
                id="area"
                type="number"
                name="area"
                placeholder="e.g., 5"
                value={formData.area}
                onChange={handleChange}
                step="0.1"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="plantingDate" className="text-sm font-medium text-foreground">
                Planting Date
              </label>
              <Input 
                id="plantingDate"
                type="date" 
                name="plantingDate" 
                value={formData.plantingDate} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Add Crop
              </Button>
              <Link href="/dashboard" className="flex-1">
                <Button variant="outline" className="w-full border-border hover:bg-accent/5 bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
