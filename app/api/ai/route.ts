import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { type } = data
    const supabase = getServerSupabase()

    if (type === "crop_health") {
      const { cropId, overallHealth, diseases, nutrients, growthStage, recommendations } = data
      if (!cropId || !overallHealth) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }
      const { error } = await supabase
        .from('ai_predictions')
        .insert([
          {
            crop_id: cropId,
            prediction_type: 'crop_health',
            prediction_data: {
              overallHealth,
              diseases: diseases || [],
              nutrients: nutrients || {},
              growthStage: growthStage || 'unknown',
              recommendations: recommendations || []
            },
            confidence_score: overallHealth.confidence || 0,
            created_at: new Date().toISOString()
          }
        ])
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (type === "yield_prediction") {
      const { cropId, yieldPrediction, factors } = data
      if (!cropId || !yieldPrediction) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }
      const { error } = await supabase
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
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (type === "weather_recommendations") {
      const { farmId, weatherData, irrigation, alerts } = data
      if (!farmId || !weatherData) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }
      const { error: weatherError } = await supabase
        .from('weather_data')
        .insert([
          {
            farm_id: farmId,
            temperature_celsius: weatherData.temperature,
            humidity_percent: weatherData.humidity,
            rainfall_mm: weatherData.rainfall,
            soil_moisture_percent: weatherData.soilMoisture,
            recorded_at: new Date().toISOString()
          }
        ])
      if (weatherError) {
        return NextResponse.json({ error: weatherError.message }, { status: 500 })
      }
      // Store AI recommendations if present
      if (irrigation || alerts) {
        await supabase
          .from('ai_recommendations')
          .insert([
            {
              farm_id: farmId,
              recommendation_type: 'weather',
              recommendation_data: { irrigation, alerts },
              created_at: new Date().toISOString()
            }
          ])
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
