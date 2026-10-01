"use client"

import {
  FileText,
  LayoutDashboard,
  Mail,
  Settings,
  ShoppingBag,
  Users,
  Wrench,
  type IconProps,
} from "@keyline-icons/react"
import { ChevronRight } from "lucide-react"
import type { ComponentType } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NavItem = { label: string; id?: string; group?: string }
type Module = {
  name: string
  short?: string
  open?: boolean
  icon: ComponentType<IconProps>
  items: NavItem[]
}

const MODULES: Module[] = [
  {
    name: "Stránky",
    icon: FileText,
    open: true,
    items: [
      { label: "Hľadať" },
      { label: "Navigátor", id: "nav" },
      { label: "Prehliadač obrázkov" },
      { label: "Prehliadač dokumentov" },
    ],
  },
  {
    name: "Šablóny",
    icon: LayoutDashboard,
    items: [
      { label: "Typy stránok" },
      { label: "Vložiť typ stránky" },
      { label: "Vlastnosti" },
      { label: "Vložiť vlastnosť" },
    ],
  },
  {
    name: "Používatelia",
    icon: Users,
    items: [
      { label: "Zobraziť" },
      { label: "Vložiť používateľa" },
      { label: "Zobraziť používateľov", group: "Používatelia webu" },
      { label: "Vložiť používateľa webu" },
    ],
  },
  {
    name: "Administrácia",
    icon: Settings,
    items: [
      { label: "Tabuľka stránok" },
      { label: "Hľadať a nahradiť" },
      { label: "Systémový denník" },
      { label: "Search index" },
    ],
  },
  {
    name: "Distribučné zoznamy",
    short: "Zoznamy",
    icon: Mail,
    items: [
      { label: "Zobraziť zoznamy" },
      { label: "Vložiť zoznam" },
      { label: "Zobraziť správy" },
      { label: "Vložiť správu" },
      { label: "Archivovať správy" },
    ],
  },
  {
    name: "Obchod",
    icon: ShoppingBag,
    items: [
      { label: "Zoznam objednávok" },
      { label: "Zoznam objednávok (legacy)" },
      { label: "Zľavové kódy" },
      { label: "Hromadné odstránenie zľavových kódov" },
      { label: "Úlohy" },
    ],
  },
  {
    name: "Nástroje",
    icon: Wrench,
    items: [
      { label: "Zobraziť formuláre", group: "Formuláre" },
      { label: "Memcache status", group: "Systém" },
      { label: "GDPR požiadavky" },
      { label: "GDPR záznamy" },
      { label: "Index vyhľadávania" },
      { label: "Test vyhľadávania" },
      { label: "Preklady" },
      { label: "Chýbajúce preklady stránok" },
      { label: "Import prekladov stránok" },
    ],
  },
]

export function ModuleNav({
  current,
  onNavigator,
  onSoon,
}: {
  current: "nav" | "detail"
  onNavigator: () => void
  onSoon: () => void
}) {
  return (
    <nav className="flex-1 overflow-auto p-2 text-sidebar-foreground" aria-label="Moduly">
      {MODULES.map((mod) => {
        const Icon = mod.icon
        return (
        <details key={mod.name} className="group" open={mod.open}>
          <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-[13px] leading-5 font-[600] hover:bg-sidebar-accent [&::-webkit-details-marker]:hidden">
            <Icon size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{mod.name}</span>
            <ChevronRight className="size-4 shrink-0 transition-transform group-open:rotate-90" />
          </summary>
          {mod.items.map((item) => (
            <div key={item.label}>
              {item.group ? (
                <p className="mt-2 mb-1 ml-8 text-[13px] leading-5 font-[600] text-muted-foreground">
                  {item.group}
                </p>
              ) : null}
              {item.id === "nav" ? (
                <Button
                  variant="ghost"
                  className={cn(
                    "h-8 w-full justify-start rounded-lg py-0 pr-2 pl-8 text-[13px] leading-5 font-[450] text-inherit hover:bg-sidebar-accent hover:text-inherit",
                    current === "nav" && "bg-sidebar-accent"
                  )}
                  onClick={onNavigator}
                >
                  {item.label}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start rounded-lg py-0 pr-2 pl-8 text-[13px] leading-5 font-[450] text-inherit hover:bg-sidebar-accent hover:text-inherit"
                  onClick={onSoon}
                >
                  {item.label}
                </Button>
              )}
            </div>
          ))}
        </details>
        )
      })}
    </nav>
  )
}
