import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { UserProvider } from "@/lib/user-context"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AgriNova AI - Precision Agriculture Platform",
  description: "AI-powered precision agriculture platform for sustainable farming",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Immediate error suppression for extension errors
                (function() {
                  const originalError = console.error;
                  const originalWarn = console.warn;
                  
                  console.error = function(...args) {
                    const message = args.join(' ').toLowerCase();
                    if (
                      message.includes('runtime.lasterror') ||
                      message.includes('message port closed') ||
                      message.includes('extension context invalidated') ||
                      message.includes('chrome-extension') ||
                      message.includes('receiving end does not exist') ||
                      message.includes('unchecked runtime.lasterror')
                    ) {
                      return;
                    }
                    return originalError.apply(console, args);
                  };
                  
                  console.warn = function(...args) {
                    const message = args.join(' ').toLowerCase();
                    if (message.includes('extension') || message.includes('devtools')) {
                      return;
                    }
                    return originalWarn.apply(console, args);
                  };
                  
                  // Suppress unhandled promise rejections from extensions
                  window.addEventListener('unhandledrejection', function(event) {
                    const reason = (event.reason || '').toString().toLowerCase();
                    if (reason.includes('extension') || reason.includes('runtime.lasterror')) {
                      event.preventDefault();
                    }
                  });
                })();
              `,
            }}
          />
        )}
      </head>
      <body className={`font-sans antialiased`}>
        <UserProvider>{children}</UserProvider>
        <Analytics />
      </body>
    </html>
  )
}
