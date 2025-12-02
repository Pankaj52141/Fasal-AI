import { type NextRequest, NextResponse } from "next/server"
import { supabase as baseClient } from "@/lib/supabase-client"
import { getServerSupabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }
    const accessToken = authHeader.replace('Bearer ', '')

    const farmId = request.nextUrl.searchParams.get("farmId")
    if (!farmId) {
      return NextResponse.json({ error: "farmId is required" }, { status: 400 })
    }

    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENWEATHER_API_KEY env" }, { status: 500 })
    }

    // Create authed client to respect RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )

    // Validate token trying two strategies for robustness
    let user: any = null
    let method = "withAuthClient"
    const { data: authData, error: authError } = await supabaseWithAuth.auth.getUser()
    if (!authError && authData?.user) {
      user = authData.user
    } else {
      method = "baseClientWithToken"
      const { data: alt, error: altErr } = await baseClient.auth.getUser(accessToken)
      if (alt && alt.user) user = alt.user
      if (!user) {
        // Optional dev fallback: allow unauthenticated weather if explicitly enabled
        if (process.env.ALLOW_PUBLIC_WEATHER === 'true') {
          const admin = getServerSupabase()
          const { data: farmRow, error: farmAuthErr } = await admin
            .from('farms')
            .select('id, farm_name, latitude, longitude, farmer_id')
            .eq('id', farmId)
            .single()
          if (!farmRow || farmAuthErr) {
            return NextResponse.json({ error: "Invalid or expired token", method, details: authError?.message || altErr?.message }, { status: 401 })
          }
          // Fake a minimal user object for downstream logic; we'll keep farmer check later
          user = { id: 'public-dev', email: null }
          // proceed; we will fetch farm again with admin later only if needed
        } else {
          return NextResponse.json({ error: "Invalid or expired token", method, details: authError?.message || altErr?.message }, { status: 401 })
        }
      }
    }

    // Resolve farmer_id for user
    const { data: profile } = await supabaseWithAuth
      .from('users')
      .select('farmer_id')
      .eq('id', user.id)
      .single()
    const farmerId = profile?.farmer_id
    if (!farmerId) {
      return NextResponse.json({ error: 'No farmer profile found' }, { status: 404 })
    }

    // Fetch the farm and validate ownership
    let farm: any = null
    let farmErr: any = null
    if (process.env.ALLOW_PUBLIC_WEATHER === 'true' && user.id === 'public-dev') {
      const admin = getServerSupabase()
      const res = await admin
        .from('farms')
        .select('id, farm_name, latitude, longitude, farmer_id')
        .eq('id', farmId)
        .single()
      farm = res.data
      farmErr = res.error
    } else {
      const res = await supabaseWithAuth
        .from('farms')
        .select('id, farm_name, latitude, longitude, farmer_id')
        .eq('id', farmId)
        .eq('farmer_id', farmerId)
        .single()
      farm = res.data
      farmErr = res.error
    }
    if (farmErr || !farm) {
      return NextResponse.json({ error: 'Farm not found or unauthorized', details: farmErr?.message }, { status: 404 })
    }

    if (farm.latitude == null || farm.longitude == null) {
      return NextResponse.json({ error: 'Farm missing latitude/longitude. Edit the farm to add coordinates.' }, { status: 400 })
    }

    // Use OpenWeather 2.5 APIs per request: current + 5 day / 3-hour forecast
    const buildUrl = (base: string, extra?: Record<string, string>) => {
      const u = new URL(base)
      u.searchParams.set('lat', String(farm.latitude))
      u.searchParams.set('lon', String(farm.longitude))
      u.searchParams.set('units', 'metric')
      u.searchParams.set('appid', apiKey)
      if (extra) {
        for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v)
      }
      return u
    }

    const [currentResp, forecastResp] = await Promise.all([
      fetch(buildUrl('https://api.openweathermap.org/data/2.5/weather').toString()),
      fetch(buildUrl('https://api.openweathermap.org/data/2.5/forecast').toString()),
    ])

    if (!currentResp.ok) {
      const text = await currentResp.text()
      return NextResponse.json({ error: 'Weather current fetch failed', details: text }, { status: currentResp.status || 502 })
    }
    if (!forecastResp.ok) {
      const text = await forecastResp.text()
      return NextResponse.json({ error: 'Weather forecast fetch failed', details: text }, { status: forecastResp.status || 502 })
    }

    const currentJson = await currentResp.json()
    const forecastJson = await forecastResp.json()

    const current = {
      temp: currentJson?.main?.temp ?? null,
      humidity: currentJson?.main?.humidity ?? null,
      windSpeed: typeof currentJson?.wind?.speed === 'number' ? Math.round(currentJson.wind.speed * 3.6) : null,
      rain: currentJson?.rain?.['1h'] ?? 0,
    }

    // Aggregate next 3 calendar days (excluding today) from 3-hourly list
    const list: any[] = Array.isArray(forecastJson?.list) ? forecastJson.list : []
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const byDay: Record<string, { temps: number[]; humid: number[]; wind: number[]; rain: number[]; ts: number } > = {}
    for (const item of list) {
      const ts = (item.dt || 0) * 1000
      const d = new Date(ts)
      const dateStr = d.toISOString().slice(0, 10)
      if (dateStr === todayStr) continue
      if (!byDay[dateStr]) byDay[dateStr] = { temps: [], humid: [], wind: [], rain: [], ts: item.dt }
      if (typeof item.main?.temp === 'number') byDay[dateStr].temps.push(item.main.temp)
      if (typeof item.main?.humidity === 'number') byDay[dateStr].humid.push(item.main.humidity)
      if (typeof item.wind?.speed === 'number') byDay[dateStr].wind.push(item.wind.speed * 3.6)
      const rain3h = (item.rain && (item.rain['3h'] ?? 0)) || 0
      byDay[dateStr].rain.push(rain3h)
    }
    const days = Object.keys(byDay).sort().slice(0, 3)
    const daily3 = days.map(dateStr => {
      const b = byDay[dateStr]
      const minTemp = b.temps.length ? Math.min(...b.temps) : null
      const maxTemp = b.temps.length ? Math.max(...b.temps) : null
      const humidity = b.humid.length ? Math.round(b.humid.reduce((a, v) => a + v, 0) / b.humid.length) : null
      const windSpeed = b.wind.length ? Math.round(b.wind.reduce((a, v) => a + v, 0) / b.wind.length) : null
      const rain = b.rain.length ? Math.round((b.rain.reduce((a, v) => a + v, 0)) * 10) / 10 : 0
      return { dt: byDay[dateStr].ts, minTemp, maxTemp, humidity, windSpeed, rain }
    })

    return NextResponse.json({
      farm: { id: farm.id, name: farm.farm_name },
      current,
      daily3,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal error fetching weather', details: error?.message }, { status: 500 })
  }
}
