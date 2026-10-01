"use client"

import type { ReactElement } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function IconHint({
  label,
  disabled,
  children,
}: {
  label: string
  disabled?: boolean
  children: ReactElement
}) {
  return (
    <Tooltip disabled={disabled}>
      <TooltipTrigger render={children} />
      <TooltipContent
        side="top"
        sideOffset={8}
        hideArrow
        className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#303030] shadow-[0_2px_8px_rgba(26,26,26,0.14),0_0_0_1px_rgba(26,26,26,0.06)]"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
