import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    const cropId = request.nextUrl.searchParams.get("cropId")
    const modelName = request.nextUrl.searchParams.get("modelName")
    const limit = request.nextUrl.searchParams.get("limit") || "50"

    if (!cropId) {
      return NextResponse.json({ error: "Crop ID required" }, { status: 400 })
    }

    const supabase = getServerSupabase()
    let query = supabase
      .from("model_predictions")
      .select("*")
      .eq("crop_id", cropId)
      .order("created_at", { ascending: false })
      .limit(Number.parseInt(limit))

    if (modelName) {
      query = query.eq("model_name", modelName)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch model predictions" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch model predictions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cropId, modelName, predictionType, predictedValue, confidence, inputFeatures, recommendation } =
      await request.json()

    if (!cropId || !modelName || !predictionType || predictedValue === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getServerSupabase()
    const { data, error } = await supabase.from("model_predictions").insert([
      {
        crop_id: cropId,
        model_name: modelName,
        prediction_type: predictionType,
        predicted_value: predictedValue,
        confidence: confidence || 0.85,
        input_features: inputFeatures || {},
        recommendation: recommendation || "",
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("[v0] Model prediction insert error:", error)
      return NextResponse.json({ error: "Failed to record model prediction" }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Model prediction POST error:", error)
    return NextResponse.json({ error: "Failed to record model prediction" }, { status: 500 })
  }
}
