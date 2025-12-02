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

    const { id: cropId } = await params

    console.log("Attempting to delete crop:", cropId)

    // Get user's farmer_id
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("farmer_id")
      .eq("id", user.id)
      .single()

    if (!userData?.farmer_id) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Verify the crop belongs to this user
    const { data: crop, error: fetchError } = await supabaseAdmin
      .from("crops")
      .select("farmer_id")
      .eq("id", cropId)
      .single()

    if (fetchError || !crop) {
      console.error("Crop lookup error:", fetchError)
      return NextResponse.json({ error: "Crop not found", details: fetchError?.message }, { status: 404 })
    }

    if (!userData || crop.farmer_id !== userData.farmer_id) {
      return NextResponse.json({ error: "Unauthorized to delete this crop" }, { status: 403 })
    }

    // Delete related ai_predictions first
    await supabaseAdmin
      .from("ai_predictions")
      .delete()
      .eq("crop_id", cropId)

    // Delete the crop
    const { error: deleteError } = await supabaseAdmin
      .from("crops")
      .delete()
      .eq("id", cropId)

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete crop" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Crop deleted successfully" 
    })

  } catch (error) {
    console.error("Error in DELETE /api/crops/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
