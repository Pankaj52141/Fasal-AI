// Gemini AI client utility
export const geminiClient = {
  async generateContent(prompt: string, context?: any) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured")
    }

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
                  text: prompt,
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
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates[0]?.content?.parts?.[0]?.text || ""
  },

  async analyzeImage(imageBase64: string, prompt: string) {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured")
    }

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
      throw new Error(`Gemini Vision API error: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates[0]?.content?.parts?.[0]?.text || ""
  },
}
