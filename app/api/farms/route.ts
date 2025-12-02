import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Extract Supabase access token
    const accessToken = authHeader.replace('Bearer ', '')
    
    // Verify the token with Supabase and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Create authed client for RLS-protected tables
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
    // Resolve farmer_id from users table (text code)
    const { data: profile, error: profileReadErr } = await supabaseWithAuth
      .from('users')
      .select('farmer_id')
      .eq('id', user.id)
      .single()
    if (profileReadErr) {
      console.warn('Profile read error (GET farms):', profileReadErr)
    }
    const farmerId = profile?.farmer_id
    if (!farmerId) {
      return NextResponse.json({ error: 'No farmer profile found. Please sign up first.' }, { status: 404 })
    }

    // Get farms for the user
    const { data: farms, error: farmsError } = await supabaseWithAuth
      .from('farms')
      .select('id, farm_code, farm_name, total_area_hectares, location_address, soil_type, city, state, farm_status, created_at, farmer_id')
      .eq('farmer_id', farmerId)
      .eq('farm_status', 'active')
      .order('created_at', { ascending: false })

    if (farmsError) {
      console.error('Error fetching farms:', farmsError)
      return NextResponse.json({ error: "Failed to fetch farms" }, { status: 500 })
    }

    console.log('Farms returned for user', farmerId, ':', farms)

    // Aggregate active crops per farm (single query)
    const { data: cropRows, error: cropsAggError } = await supabaseWithAuth
      .from('crops')
      .select('farm_id')
      .eq('farmer_id', farmerId)
      .eq('crop_status', 'active')
    if (cropsAggError) {
      console.warn('Could not aggregate crops per farm:', cropsAggError)
    }
    const cropCountMap: Record<string, number> = {}
    if (Array.isArray(cropRows)) {
      for (const row of cropRows) {
        if (!row.farm_id) continue
        cropCountMap[row.farm_id] = (cropCountMap[row.farm_id] || 0) + 1
      }
    }

    // Merge crop counts into farm objects
    const enrichedFarms = Array.isArray(farms) ? farms.map(f => ({
      ...f,
      crops_count: cropCountMap[f.id] || 0
    })) : []

    // Calculate total farm size
    const totalFarmSize = enrichedFarms.reduce((total, farm) => {
      return total + (farm.total_area_hectares || 0)
    }, 0)

    return NextResponse.json({
      farms: enrichedFarms,
      totalFarmSize,
      farmCount: enrichedFarms.length
    })

  } catch (error) {
    console.error('Error in farms API:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: "No authorization header" }, { status: 401 })
    }

    // Extract Supabase access token
    const accessToken = authHeader.replace('Bearer ', '')
    console.log('Access token received:', accessToken)
    // Check which key is used for Supabase client
    console.log('Supabase client key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'anon/public' : (process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'unknown'))

    // Verify the token with Supabase and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    console.log('Supabase user from token:', user)

    if (authError || !user) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Create authed client for RLS operations
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )

    // Get farmer profile; if missing, auto-provision with generated farmer_id
    let farmerId: string | null = null
    const { data: profile, error: profileError } = await supabaseWithAuth
      .from('users')
      .select('farmer_id')
      .eq('id', user.id)
      .single()

    if (profile && profile.farmer_id) {
      farmerId = profile.farmer_id
    } else {
      const { data: genId, error: genError } = await supabaseWithAuth.rpc('generate_farmer_id')
      if (genError || !genId) {
        console.error('Failed generating farmer_id:', genError)
        return NextResponse.json({ error: 'Could not generate farmer_id', details: genError?.message }, { status: 500 })
      }
      farmerId = genId as string
      const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Farmer'
      const { error: insertErr } = await supabaseWithAuth
        .from('users')
        .insert({
          id: user.id,
          farmer_id: farmerId,
          full_name: fullName,
          email: user.email,
          role: 'farmer',
          is_active: true
        })
      if (insertErr) {
        console.error('Failed creating user profile:', insertErr)
        return NextResponse.json({ error: 'Could not create user profile', details: insertErr.message }, { status: 500 })
      }
      console.log('Auto-provisioned user profile with farmer_id', farmerId)
    }

    const { name, location, size, soilType, latitude, longitude } = await request.json()

    if (!name || !location || !size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Debug: print farmerId before insert
    console.log('farmerId for farm insert:', farmerId)

    // Generate farm code based on UUID
    // Count existing farms for this farmerId to generate farm code
    const { count: existingFarmCount } = await supabaseWithAuth
      .from('farms')
      .select('id', { count: 'exact', head: true })
      .eq('farmer_id', farmerId)

    const farmNumber = (existingFarmCount || 0) + 1
    const farmCode = `${farmerId}_LAND${farmNumber}`

    // Insert farm with farmer_id = userId (UUID)
    const { data: newFarm, error: farmError } = await supabaseWithAuth
      .from('farms')
      .insert([
        {
          farmer_id: farmerId, // custom text, e.g., FARM704
          farm_code: farmCode, // e.g., FARM704_LAND1
          farm_name: name,
          location_address: location,
          latitude: typeof latitude === 'number' ? latitude : null,
          longitude: typeof longitude === 'number' ? longitude : null,
          total_area_hectares: parseFloat(size),
          soil_type: soilType,
          farm_status: 'active'
        }
      ])
      .select()
      .single()

    if (farmError) {
      console.error('Error creating farm:', farmError)
      return NextResponse.json({ 
        error: "Failed to create farm", 
        details: farmError.message || farmError.details || farmError.hint || farmError.code || 'Unknown error'
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Farm created successfully",
      farm: newFarm
    })

  } catch (error: any) {
    console.error('Error in POST farms:', error)
    return NextResponse.json({ error: "Internal server error", details: error?.message }, { status: 500 })
  }
}
