import { type NextRequest, NextResponse } from "next/server"
import { extractUserFromToken } from "@/lib/auth-middleware"

// Mock database
const crops: any[] = []
const farms: any[] = []

export async function GET(request: NextRequest) {
  try {
    const user = extractUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const farmId = request.nextUrl.searchParams.get("farmId")

    if (!farmId) {
      return NextResponse.json({ error: "Farm ID required" }, { status: 400 })
    }

    const farm = farms.find((f) => f.id === farmId && f.userId === user.userId)
    if (!farm) {
      return NextResponse.json({ error: "Farm not found or unauthorized" }, { status: 403 })
    }

    const farmCrops = crops.filter((c) => c.farmId === farmId)
    return NextResponse.json({ crops: farmCrops })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch crops" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = extractUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { farmId, name, variety, plantingDate, area, expectedHarvestDate } = await request.json()

    if (!farmId || !name || !plantingDate || !area) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const farm = farms.find((f) => f.id === farmId && f.userId === user.userId)
    if (!farm) {
      return NextResponse.json({ error: "Farm not found or unauthorized" }, { status: 403 })
    }

    const crop = {
      id: Math.random().toString(36).substr(2, 9),
      farmId,
      name,
      variety,
      plantingDate,
      area,
      expectedHarvestDate,
      growthStage: "seedling",
      healthStatus: "healthy",
      createdAt: new Date(),
    }

    crops.push(crop)
    return NextResponse.json({ crop }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create crop" }, { status: 500 })
  }
}
