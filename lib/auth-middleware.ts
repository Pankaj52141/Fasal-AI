import { type NextRequest, NextResponse } from "next/server"

export function extractUserFromToken(request: NextRequest): { userId: string; email: string } | null {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.slice(7)
    const decoded = JSON.parse(Buffer.from(token, "base64").toString())
    return { userId: decoded.userId, email: decoded.email }
  } catch (error) {
    return null
  }
}

export function verifyUserAuth(request: NextRequest) {
  const user = extractUserFromToken(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return user
}
