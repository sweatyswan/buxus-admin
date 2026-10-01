"use client"

import { useEffect, useState } from "react"

import { BuxusApp } from "@/components/admin/buxus-app"

export default function Page() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return null
  return <BuxusApp />
}
