import { type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Try to get the session token from the request
    // Supabase sessions are typically stored in cookies
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return { user: null, error: "No authorization header" }
    }

    // Extract the access token from the authorization header
    const accessToken = authHeader.replace('Bearer ', '')
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    
    if (error || !user) {
      return { user: null, error: "Invalid or expired token" }
    }

    return { user, error: null }
  } catch (error) {
    console.error('Auth helper error:', error)
    return { user: null, error: "Authentication failed" }
  }
}

export async function requireAuth(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request)
  
  if (!user) {
    throw new Error(error || "Authentication required")
  }
  
  return user
}