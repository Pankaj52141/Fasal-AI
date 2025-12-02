import { type NextRequest, NextResponse } from "next/server"

// Mock database
const sustainabilityMetrics: any[] = []

export async function GET(request: NextRequest) {
  try {
    const farmId = request.nextUrl.searchParams.get("farmId")

    if (!farmId) {
      return NextResponse.json({ error: "Farm ID required" }, { status: 400 })
    }

    const metrics = sustainabilityMetrics.filter((m) => m.farmId === farmId)
    return NextResponse.json({ metrics })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sustainability metrics" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { farmId, carbonFootprint, waterUsage, soilHealthScore, biodiversityIndex } = await request.json()

    if (!farmId) {
      return NextResponse.json({ error: "Farm ID required" }, { status: 400 })
    }

    const metric = {
      id: Math.random().toString(36).substr(2, 9),
      farmId,
      carbonFootprint: carbonFootprint || 0,
      waterUsage: waterUsage || 0,
      soilHealthScore: soilHealthScore || 0,
      biodiversityIndex: biodiversityIndex || 0,
      recordedAt: new Date(),
    }

    sustainabilityMetrics.push(metric)
    return NextResponse.json({ metric }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create sustainability metric" }, { status: 500 })
  }
}
