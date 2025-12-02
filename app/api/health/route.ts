import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET() {
  try {
    // Test the Supabase connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({ 
        status: 'error', 
        message: 'Database connection failed',
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
      supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ 
      status: 'error', 
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}