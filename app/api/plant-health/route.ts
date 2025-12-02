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
      .from("plant_health_metrics")
      .select("*")
      .eq("crop_id", cropId)
      .order("recorded_at", { ascending: false })
      .limit(Number.parseInt(limit))

    if (error) {
      return NextResponse.json({ error: "Failed to fetch plant health data" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plant health data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      cropId,
      leafColorIndex,
      stemDiameter,
      leafArea,
      chlorophyllContent,
      diseaseProbability,
      pestProbability,
      overallHealthScore,
    } = await request.json()

    if (!cropId) {
      return NextResponse.json({ error: "Crop ID required" }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const { data, error } = await supabase.from("plant_health_metrics").insert([
      {
        crop_id: cropId,
        leaf_color_index: leafColorIndex || 0,
        stem_diameter_mm: stemDiameter || 0,
        leaf_area_cm2: leafArea || 0,
        chlorophyll_content: chlorophyllContent || 0,
        disease_probability: diseaseProbability || 0,
        pest_probability: pestProbability || 0,
        overall_health_score: overallHealthScore || 0,
        recorded_at: new Date().toISOString(),
      },
    ])

    if (error) {
      return NextResponse.json({ error: "Failed to record plant health data" }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to record plant health data" }, { status: 500 })
  }
}
