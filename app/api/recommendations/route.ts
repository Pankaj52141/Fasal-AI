import { type NextRequest, NextResponse } from "next/server"

// Mock ML model for recommendations
function generateRecommendations(cropData: any) {
  const recommendations = []

  // Irrigation recommendation
  if (cropData.soilMoisture < 50) {
    recommendations.push({
      type: "irrigation",
      priority: "high",
      message: "Soil moisture is low. Recommend irrigation in next 24 hours.",
      action: "Schedule irrigation",
    })
  }

  // Fertilizer recommendation
  if (cropData.nitrogenLevel < 30) {
    recommendations.push({
      type: "fertilizer",
      priority: "medium",
      message: "Nitrogen levels are below optimal. Apply nitrogen fertilizer.",
      action: "Apply 50kg/ha NPK 20-20-20",
    })
  }

  // Disease warning
  if (cropData.humidity > 80 && cropData.temperature > 25) {
    recommendations.push({
      type: "disease",
      priority: "high",
      message: "High humidity and temperature detected. Risk of fungal diseases.",
      action: "Apply fungicide preventatively",
    })
  }

  return recommendations
}

export async function POST(request: NextRequest) {
  try {
    const { cropId, sensorData } = await request.json()

    if (!cropId || !sensorData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const recommendations = generateRecommendations(sensorData)

    return NextResponse.json({
      cropId,
      recommendations,
      generatedAt: new Date(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
