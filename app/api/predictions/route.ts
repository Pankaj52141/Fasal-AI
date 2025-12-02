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

    if (!cropId) {
      return NextResponse.json({ error: "Crop ID required" }, { status: 400 })
    }

    const supa = getServerSupabase()
    const { data, error } = await supa
      .from("predictions")
      .select("*")
      .eq("crop_id", cropId)
      .eq('farmer_id', farmerId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 })
    }

    return NextResponse.json({ predictions: data })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cropId, predictionType, predictionValue, confidence, recommendation } = await request.json()
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = authHeader.replace('Bearer ','')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    const server = getServerSupabase()
    const { data: profile } = await server.from('users').select('farmer_id').eq('id', user.id).single()
    const farmerId = profile?.farmer_id

    if (!cropId || !predictionType || predictionValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supa = getServerSupabase()
    const { data, error } = await supa.from("predictions").insert([
      {
        crop_id: cropId,
        prediction_type: predictionType,
        prediction_value: predictionValue,
        confidence: confidence || 0.85,
        recommendation: recommendation || "",
        farmer_id: farmerId,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      return NextResponse.json({ error: "Failed to create prediction" }, { status: 500 })
    }

    return NextResponse.json({ prediction: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create prediction" }, { status: 500 })
  }
}
