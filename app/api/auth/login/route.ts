import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Please enter both email and password" }, { status: 400 })
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    // Try to get user profile from our custom table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    // Generate token (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({ 
      userId: authData.user.id, 
      email: authData.user.email,
      farmerId: profile?.farmer_id || null
    })).toString("base64")

    // Patch Supabase Auth metadata with farmer_id if missing
    if (profile && !authData.user.user_metadata?.farmer_id && profile.farmer_id) {
      await supabase.auth.admin.updateUserById(authData.user.id, {
        user_metadata: {
          farmer_id: profile.farmer_id,
          full_name: profile.full_name,
          role: profile.role,
          email: profile.email
        }
      })
    }

    // Use profile data if available, otherwise use auth metadata
    const userData = profile ? {
      id: profile.id,
      farmerId: profile.farmer_id,
      fullName: profile.full_name,
      email: profile.email,
      farmSize: profile.total_land_hectares,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      role: profile.role,
      isActive: profile.is_active
    } : {
      id: authData.user.id,
      farmerId: authData.user.user_metadata?.farmer_id || null,
      fullName: authData.user.user_metadata?.full_name || "User",
      email: authData.user.email,
      farmSize: null,
      role: authData.user.user_metadata?.role || "farmer",
      isActive: true
    }

    return NextResponse.json({
      token,
      user: userData,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: "An error occurred. Please try again later." }, { status: 500 })
  }
}
