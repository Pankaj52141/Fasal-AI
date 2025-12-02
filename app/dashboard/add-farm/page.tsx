"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import DashboardHeader from "@/components/dashboard/header"
import { useUser } from "@/lib/user-context"

export default function AddFarmPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    size: "",
    soilType: "",
    latitude: "",
    longitude: "",
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
  }, [user, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      // Get current session for access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('No active session')
        return
      }

      const response = await fetch('/api/farms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: formData.name,
            location: formData.location,
            size: formData.size,
            soilType: formData.soilType,
            latitude: formData.latitude ? Number(formData.latitude) : undefined,
            longitude: formData.longitude ? Number(formData.longitude) : undefined,
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('Farm create failed:', response.status, err)
        alert('Error adding farm: ' + (err.error || `Status ${response.status}`) + (err.details ? `\nDetails: ${err.details}` : ''))
        return
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Unexpected farm add error:', error)
      alert('Unexpected error adding farm. Check console for details.')
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Add New Farm</h1>
          <p className="text-muted-foreground mb-8">Register a new farm to start tracking</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="farmName" className="text-sm font-medium text-foreground">
                Farm Name
              </label>
              <Input
                id="farmName"
                type="text"
                name="name"
                placeholder="e.g., North Field"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="latitude" className="text-sm font-medium text-foreground">
                  Latitude (optional)
                </label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  name="latitude"
                  placeholder="e.g., 19.0760"
                  value={formData.latitude}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="longitude" className="text-sm font-medium text-foreground">
                  Longitude (optional)
                </label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  name="longitude"
                  placeholder="e.g., 72.8777"
                  value={formData.longitude}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-foreground">
                Location
              </label>
              <Input
                id="location"
                type="text"
                name="location"
                placeholder="e.g., Maharashtra, India"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="farmSize" className="text-sm font-medium text-foreground">
                Farm Size (hectares)
              </label>
              <Input
                id="farmSize"
                type="number"
                name="size"
                placeholder="e.g., 15"
                value={formData.size}
                onChange={handleChange}
                step="0.1"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="soilType" className="text-sm font-medium text-foreground">
                Soil Type
              </label>
              <Input
                id="soilType"
                type="text"
                name="soilType"
                placeholder="e.g., Black Soil"
                value={formData.soilType}
                onChange={handleChange}
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Add Farm
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
