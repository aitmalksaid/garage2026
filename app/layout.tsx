import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import Sidebar from "@/components/sidebar"

export const metadata: Metadata = {
  title: "Garage CNG - Système de Gestion",
  description: "Système de gestion pour garage automobile",
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
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-gray-50">
          <div className="p-6">{children}</div>
        </main>
      </body>
    </html>
  )
}
