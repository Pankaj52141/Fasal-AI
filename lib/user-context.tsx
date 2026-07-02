"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"

interface User {
  id: string
  farmerId?: string
  fullName: string
  email: string
  farmSize?: number | null
  phone?: string
  address?: string
  city?: string
  state?: string
  role: string
  isActive?: boolean
}

interface UserContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial user fetch using Supabase's getUser (recommended)
    const fetchUser = async () => {
      setLoading(true)
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        )
        
        const authPromise = supabase.auth.getUser()
        
        const { data: { user: supaUser } } = await Promise.race([
          authPromise,
          timeoutPromise
        ]) as any

        if (supaUser) {
          // Try to get user profile from database
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', supaUser.id)
            .single()

          if (profile && !profileError) {
            setUser({
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
            })
          } else {
            setUser({
              id: supaUser.id,
              farmerId: undefined,
              fullName: supaUser.user_metadata?.full_name || "User",
              email: supaUser.email || "",
              role: supaUser.user_metadata?.role || "farmer",
              isActive: true
            })
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Listen for auth state changes and update user context
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        if (session?.user) {
          // Fetch user profile again on sign-in
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profile && !profileError) {
            setUser({
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
            })
          } else {
            setUser({
              id: session.user.id,
              farmerId: undefined,
              fullName: session.user.user_metadata?.full_name || "User",
              email: session.user.email || "",
              role: session.user.user_metadata?.role || "farmer",
              isActive: true
            })
          }
          setLoading(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <UserContext.Provider value={{ user, loading, setUser }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within UserProvider")
  }
  return context
}
