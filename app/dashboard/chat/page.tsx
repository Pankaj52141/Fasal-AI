"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Send, Loader } from "lucide-react"
import DashboardHeader from "@/components/dashboard/header"
import { useUser } from "@/lib/user-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const router = useRouter()
  const { user, loading: pageLoading } = useUser()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!pageLoading && !user) {
      router.push("/login")
      return
    }

    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hello! I'm AgriNova AI Assistant, powered by Gemini. I can help you with crop health monitoring, irrigation scheduling, fertilizer recommendations, disease prevention, yield predictions, and sustainability practices. What would you like to know about your farm?",
        timestamp: new Date(),
      },
    ])
  }, [router])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          userId: user?.id,
          farmContext: {
            farmSize: user?.farmSize,
            region: user?.state || user?.city,
          },
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I'm having trouble processing your request. Please try again.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase-client')
    await supabase.auth.signOut()
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader user={user} onLogout={handleLogout} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">AgriNova AI Assistant</h1>
          <p className="text-muted-foreground">Powered by Gemini - Ask me anything about your farm</p>
        </div>

        {/* Chat Messages */}
        <Card className="flex-1 p-6 border border-border/40 mb-6 overflow-y-auto max-h-96">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent/10 border border-accent/20 text-foreground"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-70">{message.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-accent/10 border border-accent/20 px-4 py-3 rounded-lg">
                  <Loader className="w-4 h-4 animate-spin text-accent" />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Ask a question about farming
          </label>
          <Input
            id="chat-input"
            name="message"
            type="text"
            placeholder="Ask about crop health, irrigation, fertilizer, diseases..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Powered by Google Gemini AI - Requires GEMINI_API_KEY environment variable
        </p>
      </main>
    </div>
  )
}
