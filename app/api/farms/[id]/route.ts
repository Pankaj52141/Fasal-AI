import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// For authentication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id: farmId } = await params

    console.log("Attempting to delete farm:", farmId)

    // Get user's farmer_id
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("farmer_id")
      .eq("id", user.id)
      .single()

    if (!userData?.farmer_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Verify the farm belongs to this user
    const { data: farm, error: fetchError } = await supabaseAdmin
      .from("farms")
      .select("farmer_id")
      .eq("id", farmId)
      .single()

    if (fetchError || !farm) {
      console.error("Farm lookup error:", fetchError)
      return NextResponse.json({ error: "Farm not found", details: fetchError?.message }, { status: 404 })
    }

    if (!userData || farm.farmer_id !== userData.farmer_id) {
      return NextResponse.json({ error: "Unauthorized to delete this farm" }, { status: 403 })
    }

    // Get all crops for this farm
    const { data: crops } = await supabaseAdmin
      .from("crops")
      .select("id")
      .eq("farm_id", farmId)

    // Delete ai_predictions for all crops
    if (crops && crops.length > 0) {
      const cropIds = crops.map(c => c.id)
      await supabaseAdmin
        .from("ai_predictions")
        .delete()
        .in("crop_id", cropIds)
    }

    // Delete all crops associated with this farm
    await supabaseAdmin
      .from("crops")
      .delete()
      .eq("farm_id", farmId)

    // Delete the farm
    const { error: deleteError } = await supabaseAdmin
      .from("farms")
      .delete()
      .eq("id", farmId)

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete farm" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Farm and associated crops deleted successfully" 
    })

  } catch (error) {
    console.error("Error in DELETE /api/farms/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
