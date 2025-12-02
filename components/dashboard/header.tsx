"use client"

import { Leaf, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DashboardHeaderProps {
  user: any
  onLogout: () => void
}

export default function DashboardHeader({ user, onLogout }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground hidden sm:inline">Fasal AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition">
            Dashboard
          </Link>
          <Link href="/dashboard/analytics" className="text-sm text-muted-foreground hover:text-foreground transition">
            Analytics
          </Link>
          <Link href="/dashboard/chat" className="text-sm text-muted-foreground hover:text-foreground transition">
            AI Chat
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/20">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
