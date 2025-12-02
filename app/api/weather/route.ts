import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const farmId = request.nextUrl.searchParams.get("farmId")
    const limit = request.nextUrl.searchParams.get("limit") || "100"

    if (!farmId) {
      return NextResponse.json({ error: "Farm ID required" }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from("weather_data")
      .select("*")
      .eq("farm_id", farmId)
      .order("recorded_at", { ascending: false })
      .limit(Number.parseInt(limit))

    if (error) {
      return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { farmId, temperatureCelsius, humidityPercent, rainfallMm, windSpeedKmh, uvIndex, soilMoisturePercent } =
      await request.json()

    if (!farmId) {
      return NextResponse.json({ error: "Farm ID required" }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const { data, error } = await supabase.from("weather_data").insert([
      {
        farm_id: farmId,
        temperature_celsius: temperatureCelsius || 0,
        humidity_percent: humidityPercent || 0,
        rainfall_mm: rainfallMm || 0,
        wind_speed_kmh: windSpeedKmh || 0,
        uv_index: uvIndex || 0,
        soil_moisture_percent: soilMoisturePercent || 0,
        recorded_at: new Date().toISOString(),
      },
    ])

    if (error) {
      return NextResponse.json({ error: "Failed to record weather data" }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to record weather data" }, { status: 500 })
  }
}
