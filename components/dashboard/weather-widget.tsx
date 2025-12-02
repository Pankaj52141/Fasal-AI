"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Cloud, Droplets, Wind, Sun, Loader2 } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { supabase } from "@/lib/supabase-client"

interface CurrentWeather { temp: number | null; humidity: number | null; windSpeed: number | null; rain: number }
interface ForecastDay { dt: number; minTemp: number; maxTemp: number; humidity: number; windSpeed: number; rain: number }

export default function WeatherWidget() {
  const { user } = useUser()
  const [weather, setWeather] = useState<{ current: CurrentWeather; daily3: ForecastDay[] } | null>(null)
  const [farmName, setFarmName] = useState<string | null>(null)
  const [farms, setFarms] = useState<{id: string; farm_name: string}[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.farmerId) return

    const fetchWeatherData = async () => {
      try {
        const { data: farms } = await supabase
          .from('farms')
          .select('id, farm_name')
          .eq('farmer_id', user.farmerId)
          .order('created_at', { ascending: false })
        setFarms(farms || [])
        let farmToUse: { id: string; farm_name: string } | null = null
        const saved = typeof window !== 'undefined' ? localStorage.getItem('weatherSelectedFarmId') : null
        if (saved && farms?.some(f => f.id === saved)) {
          farmToUse = farms!.find(f => f.id === saved) || null
        } else {
          farmToUse = farms && farms.length > 0 ? farms[0] : null
        }
        if (!farmToUse) {
          setWeather(null)
          setFarmName(null)
          setLoading(false)
          return
        }
        setSelectedFarmId(farmToUse.id)
        setFarmName(farmToUse.farm_name)

        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) {
          setWeather(null)
          setLoading(false)
          return
        }

        const res = await fetch(`/api/weather/live?farmId=${farmToUse.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          setWeather(null)
          setLoading(false)
          return
        }
        const payload = await res.json()
        setWeather({ current: payload.current, daily3: payload.daily3 })
      } catch (error) {
        console.error('Error fetching weather data:', error)
        setWeather(null)
      } finally {
        setLoading(false)
      }
    }

    fetchWeatherData()
  }, [user?.farmerId])

  const onChangeFarm = async (id: string) => {
    setSelectedFarmId(id)
    if (typeof window !== 'undefined') localStorage.setItem('weatherSelectedFarmId', id)
    setLoading(true)
    try {
      const farm = farms.find(f => f.id === id)
      if (!farm) { setWeather(null); setLoading(false); return }
      setFarmName(farm.farm_name)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setWeather(null); setLoading(false); return }
      const res = await fetch(`/api/weather/live?farmId=${farm.id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { setWeather(null); setLoading(false); return }
      const payload = await res.json()
      setWeather({ current: payload.current, daily3: payload.daily3 })
    } catch (e) {
      console.error('Failed changing farm weather', e)
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6 border border-border/40">
        <h3 className="text-lg font-semibold text-foreground mb-4">Weather</h3>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </Card>
    )
  }

  if (!weather) {
    return (
      <Card className="p-6 border border-border/40">
        <h3 className="text-lg font-semibold text-foreground mb-4">Weather</h3>
        <div className="text-center text-muted-foreground">
          <p>Add a farm with coordinates to see weather</p>
          <p className="text-sm">Edit farm to set latitude and longitude</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border border-border/40">
      <h3 className="text-lg font-semibold text-foreground mb-4">Weather</h3>
      {farms.length > 0 && (
        <div className="mb-3">
          <label className="text-xs text-muted-foreground mr-2">Farm:</label>
          <select
            value={selectedFarmId || ''}
            onChange={(e) => onChangeFarm(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
          >
            {farms.map(f => <option key={f.id} value={f.id}>{f.farm_name}</option>)}
          </select>
        </div>
      )}

      {/* Current Weather */}
      <div className="mb-6 p-4 rounded-lg bg-linear-to-br from-accent/10 to-primary/10 border border-accent/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-4xl font-bold text-foreground">{weather.current.temp ?? '--'}°C</p>
            {farmName && <p className="text-muted-foreground">{farmName}</p>}
          </div>
          <Sun className="w-12 h-12 text-yellow-500" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="font-semibold text-foreground">{weather.current.humidity ?? '--'}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Wind</p>
              <p className="font-semibold text-foreground">{weather.current.windSpeed ?? '--'} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-xs text-muted-foreground">Rain</p>
              <p className="font-semibold text-foreground">{weather.current.rain ?? 0} mm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground mb-3">3-Day Forecast</p>
        {weather.daily3.map((day, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded border border-border/40">
            <div>
              <p className="text-sm font-medium text-foreground">{new Date(day.dt * 1000).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">wind {day.windSpeed} km/h • rain {day.rain} mm</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{Math.round(day.maxTemp)}°</p>
              <p className="text-xs text-muted-foreground">{Math.round(day.minTemp)}°</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
