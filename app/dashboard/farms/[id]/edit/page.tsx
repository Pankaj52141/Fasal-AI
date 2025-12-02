"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { useUser } from "@/lib/user-context"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import DashboardHeader from "@/components/dashboard/header"
import Link from "next/link"

export default function EditFarmPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading } = useUser()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    farm_name: "",
    location_address: "",
    total_area_hectares: "",
    soil_type: "",
    latitude: "",
    longitude: "",
  })
  const [loadingFarm, setLoadingFarm] = useState(true)
  const farmId = (params?.id as string) || ""

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadFarm = async () => {
      if (!user?.farmerId || !farmId) return
      setLoadingFarm(true)
      const { data, error } = await supabase
        .from('farms')
        .select('id, farm_name, location_address, total_area_hectares, soil_type, latitude, longitude, farmer_id')
        .eq('id', farmId)
        .eq('farmer_id', user.farmerId)
        .single()
      if (error || !data) {
        console.error('Failed to load farm', error)
        router.push('/dashboard')
        return
      }
      setForm({
        farm_name: data.farm_name || "",
        location_address: data.location_address || "",
        total_area_hectares: data.total_area_hectares?.toString() || "",
        soil_type: data.soil_type || "",
        latitude: data.latitude?.toString() || "",
        longitude: data.longitude?.toString() || "",
      })
      setLoadingFarm(false)
    }
    loadFarm()
  }, [user?.farmerId, farmId, router])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.farmerId || !farmId) return
    setSaving(true)
    const payload: any = {
      farm_name: form.farm_name,
      location_address: form.location_address,
      soil_type: form.soil_type,
    }
    if (form.total_area_hectares) payload.total_area_hectares = Number(form.total_area_hectares)
    payload.latitude = form.latitude ? Number(form.latitude) : null
    payload.longitude = form.longitude ? Number(form.longitude) : null

    const { error } = await supabase
      .from('farms')
      .update(payload)
      .eq('id', farmId)
      .eq('farmer_id', user.farmerId)

    setSaving(false)
    if (error) {
      alert('Failed to update farm: ' + error.message)
      return
    }
    router.push('/dashboard')
  }

  if (loading || loadingFarm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} onLogout={async () => { await supabase.auth.signOut(); router.push('/') }} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard" className="text-primary hover:text-primary/80 mb-8 inline-block">← Back to Dashboard</Link>
        <Card className="p-8 border border-border/40">
          <h1 className="text-2xl font-bold text-foreground mb-2">Edit Farm</h1>
          <p className="text-muted-foreground mb-6">Update farm details and coordinates</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm">Farm Name</label>
              <Input name="farm_name" value={form.farm_name} onChange={onChange} required />
            </div>
            <div>
              <label className="text-sm">Location</label>
              <Input name="location_address" value={form.location_address} onChange={onChange} />
            </div>
            <div>
              <label className="text-sm">Size (hectares)</label>
              <Input type="number" step="0.1" name="total_area_hectares" value={form.total_area_hectares} onChange={onChange} />
            </div>
            <div>
              <label className="text-sm">Soil Type</label>
              <Input name="soil_type" value={form.soil_type} onChange={onChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Latitude</label>
                <Input type="number" step="0.000001" name="latitude" value={form.latitude} onChange={onChange} />
              </div>
              <div>
                <label className="text-sm">Longitude</label>
                <Input type="number" step="0.000001" name="longitude" value={form.longitude} onChange={onChange} />
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={saving} className="flex-1">{saving ? 'Saving...' : 'Save Changes'}</Button>
              <Link href="/dashboard" className="flex-1"><Button variant="outline" className="w-full">Cancel</Button></Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
