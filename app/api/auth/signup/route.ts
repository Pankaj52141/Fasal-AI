import { type NextRequest, NextResponse } from "next/server"
import { supabase, getServerSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fullName: string | undefined = body.fullName
    let email: string | undefined = body.email
    let userId: string | undefined = body.userId

    // Validation
    // If Authorization header present, derive user from token
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken)
      if (authErr || !user) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
      }
      userId = user.id
      email = email || user.email || undefined
    }

    if (!fullName || !email || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use server client to bypass RLS for database operations
    const serverSupabase = getServerSupabase()

    // Generate unique farmer ID using the database function
    const { data: farmerIdResult, error: farmerIdError } = await serverSupabase
      .rpc('generate_farmer_id')

    if (farmerIdError) {
      console.error('Error generating farmer ID:', farmerIdError)
      return NextResponse.json({ error: "Failed to generate farmer ID" }, { status: 500 })
    }

    const farmerId = farmerIdResult

    // Upsert user profile in our custom table using server client (id is the conflict target)
    const { data: upsertedUser, error: profileError } = await serverSupabase
      .from('users')
      .upsert(
        {
          id: userId,
          farmer_id: farmerId,
          full_name: fullName,
          email,
          total_land_hectares: null,
          role: 'farmer',
          is_active: true
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single()

    if (profileError || !upsertedUser) {
      console.error('Profile creation failed:', profileError)
      return NextResponse.json({ 
        error: "Profile creation failed: " + (profileError?.message || 'Unknown error')
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: upsertedUser
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
