import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, cropType, farmContext } = await request.json()

    if (!imageBase64 || !cropType) {
      return NextResponse.json({ error: "Image and crop type required" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API not configured" }, { status: 500 })
    }

    const prompt = `Analyze this ${cropType} crop image and provide:
1. Overall health status (healthy/at-risk/diseased)
2. Visible diseases or pest damage
3. Nutrient deficiency signs
4. Growth stage assessment
5. Recommended actions

Be specific and actionable for a farmer.`

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 })
    }

    const data = await response.json()
    const analysis = data.candidates[0]?.content?.parts?.[0]?.text || ""

    return NextResponse.json({
      analysis,
      cropType,
      analyzedAt: new Date(),
    })
  } catch (error) {
    console.error("[v0] Crop analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze crop" }, { status: 500 })
  }
}
