import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const cropId = request.nextUrl.searchParams.get("cropId")
    const limit = request.nextUrl.searchParams.get("limit") || "50"

    if (!cropId) {
      return NextResponse.json({ error: "Crop ID required" }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from("stress_sound_data")
      .select("*")
      .eq("crop_id", cropId)
      .order("recorded_at", { ascending: false })
      .limit(Number.parseInt(limit))

    if (error) {
      return NextResponse.json({ error: "Failed to fetch stress sound data" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stress sound data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cropId, frequencyHz, amplitude, stressLevel, soundType } = await request.json()

    if (!cropId || frequencyHz === undefined || amplitude === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const { data, error } = await supabase.from("stress_sound_data").insert([
      {
        crop_id: cropId,
        frequency_hz: frequencyHz,
        amplitude,
        stress_level: stressLevel || 0,
        sound_type: soundType || "acoustic",
        recorded_at: new Date().toISOString(),
      },
    ])

    if (error) {
      return NextResponse.json({ error: "Failed to record stress sound data" }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to record stress sound data" }, { status: 500 })
  }
}
