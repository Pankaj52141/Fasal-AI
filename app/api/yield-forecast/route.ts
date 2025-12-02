import { type NextRequest, NextResponse } from "next/server"

// Mock ML model for yield forecasting
function forecastYield(cropData: any) {
  const baseYield = 7.5 // tons/ha
  const healthFactor = (cropData.healthScore || 80) / 100
  const moistureFactor = Math.min((cropData.soilMoisture || 60) / 70, 1.2)
  const nutrientFactor = (cropData.nutrientScore || 75) / 100

  const predictedYield = baseYield * healthFactor * moistureFactor * nutrientFactor
  const confidence = 0.82

  return {
    predictedYield: Math.round(predictedYield * 100) / 100,
    confidence,
    factors: {
      health: healthFactor,
      moisture: moistureFactor,
      nutrients: nutrientFactor,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cropId, cropData } = await request.json()

    if (!cropId || !cropData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const forecast = forecastYield(cropData)

    return NextResponse.json({
      cropId,
      ...forecast,
      forecastedAt: new Date(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to forecast yield" }, { status: 500 })
  }
}
