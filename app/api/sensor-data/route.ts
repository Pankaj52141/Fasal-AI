import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase, supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const cropId = request.nextUrl.searchParams.get("cropId")
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ','')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const server = getServerSupabase()
    const { data: profile } = await server.from('users').select('farmer_id').eq('id', user.id).single()
    const farmerId = profile?.farmer_id
    const sensorType = request.nextUrl.searchParams.get("sensorType")
    const limit = request.nextUrl.searchParams.get("limit") || "100"

    if (!cropId) {
      return NextResponse.json({ error: "Crop ID required" }, { status: 400 })
    }

    const supabase = getServerSupabase()
    let query = supabase
      .from("sensor_data")
      .select("*")
      .eq("crop_id", cropId)
      .order("recorded_at", { ascending: false })
      .limit(Number.parseInt(limit))

    if (sensorType) {
      query = query.eq("sensor_type", sensorType)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Sensor data fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch sensor data" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("[v0] Sensor data error:", error)
    return NextResponse.json({ error: "Failed to fetch sensor data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cropId, sensorType, value, unit } = await request.json()
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ','')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const server = getServerSupabase()
    const { data: profile } = await server.from('users').select('farmer_id').eq('id', user.id).single()
    const farmerId = profile?.farmer_id

    if (!cropId || !sensorType || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supa = getServerSupabase()
    const { data, error } = await supa.from("sensor_data").insert([
      {
        crop_id: cropId,
        sensor_type: sensorType,
        value,
        unit: unit || "default",
        farmer_id: farmerId,
        recorded_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("[v0] Sensor data insert error:", error)
      return NextResponse.json({ error: "Failed to record sensor data" }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Sensor data POST error:", error)
    return NextResponse.json({ error: "Failed to record sensor data" }, { status: 500 })
  }
}
