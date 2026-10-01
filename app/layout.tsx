import type { Metadata } from "next"
import { Open_Sans } from "next/font/google"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import "./globals.css"

const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "BUXUS · Navigátor",
  description: "Prototyp administrácie BUXUS. Navigátor a detail stránky.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="sk" suppressHydrationWarning className={cn(openSans.variable)}>
      <body className="min-h-svh font-sans antialiased">
        <ThemeProvider>
          <TooltipProvider delay={300}>
            <Toaster>{children}</Toaster>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
