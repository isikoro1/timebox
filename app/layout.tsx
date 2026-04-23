import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Timebox",
  description: "A minimal timeboxing planner with drag, resize, alarms, and JSON backup.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
