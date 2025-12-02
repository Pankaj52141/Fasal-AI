import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const {
      cropId,
      yieldPrediction,
      factors
    } = data

    // Validate required fields
    if (!cropId || !yieldPrediction) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Store yield prediction in database
    const { error: yieldError } = await supabase
      .from('ai_predictions')
      .insert([
        {
          crop_id: cropId,
          prediction_type: 'yield_forecast',
          prediction_data: {
            yieldPrediction,
            factors: factors || {}
          },
          confidence_score: yieldPrediction.confidence || 0,
          created_at: new Date().toISOString()
        }
      ])

    if (yieldError) {
      console.error('Error storing yield prediction:', yieldError)
      return NextResponse.json({ error: "Failed to store prediction" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Yield prediction stored successfully",
      predictionId: `yield_${Date.now()}`,
      prediction: {
        yield: yieldPrediction.expectedYield,
        unit: yieldPrediction.unit,
        confidence: yieldPrediction.confidence,
        harvestDate: yieldPrediction.harvestDate
      }
    })

  } catch (error) {
    console.error('Yield prediction error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}