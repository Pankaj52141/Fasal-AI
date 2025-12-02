import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { cropId, sensorData, historicalData } = await request.json()

    if (!cropId || !sensorData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Mock ML predictions
    const predictions = {
      yieldForecast: {
        value: 8.5,
        confidence: 0.87,
        trend: "increasing",
        factors: {
          positive: ["Optimal soil moisture", "Good nutrient levels", "Healthy growth stage"],
          negative: ["Slight humidity risk"],
        },
      },
      diseaseRisk: {
        level: "low",
        confidence: 0.92,
        risks: [
          { disease: "Powdery Mildew", probability: 0.15, recommendation: "Monitor humidity levels" },
          { disease: "Leaf Spot", probability: 0.08, recommendation: "Ensure proper drainage" },
        ],
      },
      irrigationSchedule: {
        nextWatering: "2024-12-15",
        amount: 50,
        unit: "mm",
        frequency: "Every 3 days",
        confidence: 0.85,
      },
      fertilizerNeeds: {
        nitrogen: { current: 35, optimal: 40, recommendation: "Apply 10kg/ha" },
        phosphorus: { current: 28, optimal: 30, recommendation: "Apply 5kg/ha" },
        potassium: { current: 32, optimal: 35, recommendation: "Apply 8kg/ha" },
      },
    }

    return NextResponse.json({
      cropId,
      predictions,
      generatedAt: new Date(),
      nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.error("[v0] Prediction error:", error)
    return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 })
  }
}
