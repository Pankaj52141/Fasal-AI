import { type NextRequest, NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/supabase-client"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const {
      farmId,
      weatherData,
      irrigation,
      alerts
    } = data

    // Validate required fields
    if (!farmId || !weatherData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getServerSupabase()

    // Store weather data
    const { error: weatherError } = await supabase
      .from('weather_data')
      .insert([
        {
          farm_id: farmId,
          temperature_celsius: weatherData.temperature,
          humidity_percent: weatherData.humidity,
          rainfall_mm: weatherData.rainfall,
          soil_moisture_percent: weatherData.soilMoisture,
          recorded_at: new Date().toISOString()
        }
      ])

    if (weatherError) {
      console.error('Error storing weather data:', weatherError)
    }



    // Create farmer notifications for alerts
    if (alerts && alerts.length > 0) {
      for (const alert of alerts) {
        await supabase
          .from('farmer_notifications')
          .insert([
            {
              farm_id: farmId,
              notification_type: alert.type || 'weather_alert',
              title: alert.type === 'disease_risk' ? 'Disease Risk Alert' : 'Weather Alert',
              message: alert.message,
              priority: alert.severity || 'medium',
              is_actionable: true,
              action_url: '/dashboard/recommendations'
            }
          ])
      }
    }

    return NextResponse.json({
      success: true,
      message: "Weather recommendations stored successfully",
      irrigation: irrigation,
      alertsCount: alerts?.length || 0
    })

  } catch (error) {
    console.error('Weather recommendations error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}