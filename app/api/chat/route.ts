import { type NextRequest, NextResponse } from "next/server"

async function callGeminiAPI(message: string, context?: any) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error("[v0] GEMINI_API_KEY not configured")
    return getDefaultResponse(message)
  }

  try {
    // Build context for better responses
    const systemPrompt = `You are AgriNova AI, an expert agricultural assistant helping farmers optimize their crops. 
You provide advice on:
- Crop health monitoring and disease prevention
- Irrigation scheduling and water management
- Fertilizer recommendations based on soil conditions
- Yield predictions and harvest planning
- Sustainability practices and carbon footprint reduction
- Weather-based farming decisions

Always provide practical, actionable advice specific to farming. Keep responses concise and farmer-friendly.
${context ? `Current farm context: ${JSON.stringify(context)}` : ""}`

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
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
                  text: `${systemPrompt}\n\nUser question: ${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

    if (!response.ok) {
      console.error("[v0] Gemini API error:", response.status)
      return getDefaultResponse(message)
    }

    const data = await response.json()

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text
    }

    return getDefaultResponse(message)
  } catch (error) {
    console.error("[v0] Error calling Gemini API:", error)
    return getDefaultResponse(message)
  }
}

function getDefaultResponse(message: string): string {
  // Fallback responses when Gemini API is not available
  const lowerMessage = message.toLowerCase()

  const responses: { [key: string]: string } = {
    irrigation:
      "Based on current soil moisture levels, I recommend watering your crops when soil moisture drops below 50%. For most crops, optimal moisture is 60-70%. Monitor weather forecasts to adjust irrigation schedules accordingly.",
    fertilizer:
      "For optimal crop growth, apply a balanced NPK fertilizer (20-20-20) during the vegetative stage at 50kg/hectare. Adjust based on soil test results. Split applications are recommended for better nutrient uptake.",
    disease:
      "Monitor your crops regularly for signs of disease. Common issues include powdery mildew, leaf spots, and root rot. Ensure proper drainage, avoid overhead watering, and apply fungicides preventatively during high humidity periods.",
    yield:
      "Yield depends on multiple factors: crop variety, soil quality, water availability, nutrient management, and weather. With optimal management, you can expect 20-40% yield increases. Track your metrics to identify improvement areas.",
    weather:
      "Weather significantly impacts farming. Monitor forecasts for rainfall, temperature, and humidity. Plan irrigation around expected rain, protect crops from extreme temperatures, and adjust fertilizer application timing based on weather patterns.",
    soil: "Healthy soil is the foundation of successful farming. Conduct soil tests annually to check pH, nutrient levels, and organic matter. Improve soil health through crop rotation, composting, and reduced tillage practices.",
    pest: "Integrated pest management (IPM) is most effective. Scout crops regularly, use resistant varieties, encourage beneficial insects, and apply pesticides only when necessary. Rotate crops to break pest cycles.",
    sustainability:
      "Sustainable farming practices include crop rotation, conservation tillage, water harvesting, and organic matter management. These practices improve long-term productivity while reducing environmental impact.",
    default:
      "I can help you with crop health, irrigation, fertilizer, disease management, yield predictions, and sustainability. What specific aspect of your farm would you like advice on?",
  }

  for (const [key, response] of Object.entries(responses)) {
    if (lowerMessage.includes(key)) {
      return response
    }
  }

  return responses.default
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId, farmContext } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Get AI response
    const response = await callGeminiAPI(message, farmContext)

    // In production, save to database
    // await db.chatHistory.create({
    //   userId,
    //   message,
    //   response,
    //   createdAt: new Date(),
    // })

    return NextResponse.json({ response })
  } catch (error) {
    console.error("[v0] Chat error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
