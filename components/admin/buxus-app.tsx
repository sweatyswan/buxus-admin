"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { List } from "@keyline-icons/react"
import { CircleHelp, Menu, Search } from "lucide-react"

import { IconHint } from "@/components/admin/icon-hint"
import { ModuleNav } from "@/components/admin/module-nav"
import { NavigatorTree } from "@/components/admin/navigator-tree"
import { emptyForm, PageDetail, type FormState } from "@/components/admin/page-detail"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import {
  clonePages,
  findPage,
  flatten,
  mapPages,
  matches,
  moveItem,
  orderByIds,
  pagePath,
  slugFromName,
  stran,
  type PageNode,
} from "@/lib/pages"

type View = "nav" | "detail"
type Mode = "type" | "tree" | "prop"

const MODES: { value: Mode; label: string }[] = [
  { value: "type", label: "Podľa typu" },
  { value: "tree", label: "Podľa hierarchie" },
  { value: "prop", label: "Podľa vlastnosti" },
]

function snapshotOf(form: FormState) {
  return JSON.stringify(form)
}

function validate(form: FormState) {
  const errors: Record<string, string> = {}
  if (!form.name.trim()) errors.name = "Doplňte názov stránky."
  if (form.metaDesc.length > 170) errors.metaDesc = "Skráťte popis na najviac 170 znakov."
  if (form.metaTitle.length > 35) errors.metaTitle = "Skráťte titulok na najviac 35 znakov."
  if (form.tabTitle.length > 65) errors.tabTitle = "Skráťte názov v záložke na najviac 65 znakov."
  if (/\s/.test(form.seoUrl)) errors.seoUrl = "Adresa nemá obsahovať medzery."
  return errors
}

export function BuxusApp() {
  const [pages, setPages] = useState(clonePages)
  const [view, setView] = useState<View>("nav")
  const [mode, setMode] = useState<Mode>("type")
  const [query, setQuery] = useState("")
  const [hitsOpen, setHitsOpen] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)
  const [currentId, setCurrentId] = useState<number | undefined>()
  const [form, setForm] = useState<FormState>(() => emptyForm({ name: "", id: 0, status: "pub" }))
  const [snap, setSnap] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [reorderId, setReorderId] = useState<number | null>(null)
  const [reorderGroup, setReorderGroup] = useState<string | null>(null)
  const [reorderSnap, setReorderSnap] = useState<number[] | null>(null)
  const cancelReorderRef = useRef<() => void>(() => {})
  const [editorKey, setEditorKey] = useState("0")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const current = currentId ? findPage(pages, currentId) : undefined
  const dirty = snap !== "" && snapshotOf(form) !== snap
  const hits = useMemo(
    () => flatten(pages).filter((page) => matches(page, query)).slice(0, 6),
    [pages, query]
  )
  const resultCount = useMemo(() => {
    const needle = query.trim()
    if (!needle) return null
    const found = flatten(pages).filter((page) => matches(page, needle))
    return mode === "prop" ? found.filter((page) => page.detail).length : found.length
  }, [pages, query, mode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        document.getElementById("global-q")?.focus()
      }
      if (e.key === "Escape") cancelReorderRef.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  function soon() {
    toast.add({ title: "Táto akcia je v pôvodnej administrácii." })
    setSideOpen(false)
  }

  function goNav() {
    if (dirty) {
      toast.add({ title: "Najprv uložte alebo zahoďte zmeny." })
      return
    }
    setView("nav")
    setSideOpen(false)
  }

  function patchForm(next: Partial<FormState>) {
    setForm((prev) => {
      const merged = { ...prev, ...next }
      setErrors(validate(merged))
      return merged
    })
  }

  function openPage(page: PageNode, rename?: boolean) {
    if (dirty && currentId !== page.id) {
      toast.add({ title: "Najprv uložte alebo zahoďte zmeny." })
      return
    }
    const next = emptyForm(page)
    setCurrentId(page.id)
    setForm(next)
    setSnap(snapshotOf(next))
    setErrors({})
    setEditorKey(`${page.id}-${Date.now()}`)
    setView("detail")
    setHitsOpen(false)
    setSideOpen(false)
    if (rename) {
      requestAnimationFrame(() => document.getElementById("name")?.focus())
    }
  }

  function toggle(id: number) {
    setPages((prev) => mapPages(prev, (page) => (page.id === id ? { ...page, open: !page.open } : page)))
  }

  function applyOrder(nodes: PageNode[], parentId: number, ids: number[]) {
    if (parentId === 1) return orderByIds(nodes, ids)
    return mapPages(nodes, (page) =>
      page.id === parentId && page.kids ? { ...page, kids: orderByIds(page.kids, ids) } : page
    )
  }

  function collapseAll() {
    setPages((prev) => {
      const base = reorderId != null && reorderSnap ? applyOrder(prev, reorderId, reorderSnap) : prev
      return mapPages(base, (page) => (page.open ? { ...page, open: false } : page))
    })
    setReorderId(null)
    setReorderGroup(null)
    setReorderSnap(null)
  }

  function reorder(id: number, group: string) {
    const same = reorderId === id && reorderGroup === group
    const base = !same && reorderId != null && reorderSnap ? applyOrder(pages, reorderId, reorderSnap) : pages
    const ids = id === 1 ? base.map((page) => page.id) : (findPage(base, id)?.kids ?? []).map((page) => page.id)
    setReorderSnap(ids)
    setReorderId(id)
    setReorderGroup(group)
    setPages(id === 1 ? base : mapPages(base, (page) => (page.id === id ? { ...page, open: true } : page)))
  }

  function cancelReorder() {
    if (reorderId != null && reorderSnap) {
      const parentId = reorderId
      const ids = reorderSnap
      setPages((prev) => applyOrder(prev, parentId, ids))
    }
    setReorderId(null)
    setReorderGroup(null)
    setReorderSnap(null)
  }

  function saveReorder() {
    setReorderId(null)
    setReorderGroup(null)
    setReorderSnap(null)
  }

  cancelReorderRef.current = cancelReorder

  function moveSibling(parentId: number, fromId: number, toId: number) {
    setPages((prev) =>
      parentId === 1
        ? moveItem(prev, fromId, toId)
        : mapPages(prev, (page) =>
            page.id === parentId && page.kids ? { ...page, kids: moveItem(page.kids, fromId, toId) } : page
          )
    )
  }

  function hide(page: PageNode) {
    const next = page.status === "hide" ? "pub" : "hide"
    setPages((prev) => mapPages(prev, (item) => (item.id === page.id ? { ...item, status: next } : item)))
    toast.add({ title: next === "hide" ? "Stránka je skrytá." : "Stránka je viditeľná." })
  }

  async function save() {
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      if (nextErrors.metaDesc || nextErrors.metaTitle || nextErrors.tabTitle || nextErrors.seoUrl) {
        patchForm({ seoOpen: true })
      }
      return
    }
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    if (currentId) {
      setPages((prev) =>
        mapPages(prev, (page) =>
          page.id === currentId ? { ...page, name: form.name.trim(), status: form.status } : page
        )
      )
    }
    setSnap(snapshotOf({ ...form, name: form.name.trim() }))
    setSaving(false)
    toast.add({ title: "Uložené." })
  }

  function discard() {
    const restored = JSON.parse(snap) as FormState
    setForm(restored)
    setEditorKey(`${currentId}-discard-${Date.now()}`)
    setErrors({})
  }

  const sidebar = (
    <>
      <div className="flex h-14 items-center border-b border-white/10 bg-[#1a1a1a] px-4 text-xl font-bold text-white">
        BUXUS
      </div>
      <ModuleNav current={view} onNavigator={goNav} onSoon={soon} />
      <div className="border-t px-4 py-3 text-xs leading-4 text-muted-foreground">
        BUXUS by <a className="underline" href="mailto:buxus@ui42.com">ui42</a>
        <br />
        Verzia dev-redesign/admin
      </div>
    </>
  )

  return (
    <div className="grid min-h-svh md:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r bg-sidebar md:flex">
        {sidebar}
      </aside>
      <Sheet open={sideOpen} onOpenChange={setSideOpen}>
        <SheetContent side="left" className="w-[min(280px,88vw)] p-0">
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#1a1a1a] bg-[#1a1a1a] px-6 text-white max-sm:px-4">
          <IconHint label="Menu">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white md:hidden" aria-label="Otvoriť menu" onClick={() => setSideOpen(true)}>
              <Menu />
            </Button>
          </IconHint>
          <div className="relative max-w-[560px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/60" />
            <Input
              id="global-q"
              type="search"
              placeholder="Hľadať v BUXUSe"
              className="h-9 rounded-xl border-transparent bg-[#303030] pr-16 pl-9 text-white placeholder:text-white/55 focus-visible:border-white/20"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHitsOpen(true)
              }}
              onFocus={() => query && setHitsOpen(true)}
              onBlur={() => setTimeout(() => setHitsOpen(false), 120)}
            />
            <Kbd className="absolute top-1/2 right-3 hidden -translate-y-1/2 border-white/20 bg-transparent text-white/70 sm:inline-flex">⌘K</Kbd>
            {hitsOpen && query ? (
              <div className="absolute inset-x-0 top-10 z-30 rounded-xl border bg-popover p-1 shadow-lg">
                {hits.length ? (
                  hits.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      className="flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left hover:bg-muted"
                      onMouseDown={() => openPage(page)}
                    >
                      {page.name}
                      <span className="text-xs text-muted-foreground">#{page.id}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Nič sa nenašlo.</p>
                )}
              </div>
            ) : null}
          </div>
          <IconHint label="Pomoc">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" aria-label="Pomoc" onClick={() => toast.add({ title: "Pomoc je v pôvodnej administrácii, odkaz vpravo hore." })}>
              <CircleHelp />
            </Button>
          </IconHint>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
              aria-label="Menu účtu"
            >
              A
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Administrator</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={soon}>Vzhľad</DropdownMenuItem>
              <DropdownMenuItem onClick={soon}>Odhlásiť</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {view === "nav" ? (
          <section className="w-full p-6 pr-12">
            <div className="mb-6">
              <h1 className="text-xl leading-6 font-bold">Navigátor</h1>
            </div>
            <Card>
              <CardContent className="space-y-4 px-0">
                <div className="flex flex-wrap items-center gap-3 px-(--card-spacing)">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="názov, ID alebo URL"
                      aria-label="Hľadať stránku"
                      className="h-9 rounded-xl border border-input pl-9 font-[450]"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  {query ? (
                    <Button variant="outline" size="compact" className="rounded-full" onClick={() => setQuery("")}>
                      {query} ×
                    </Button>
                  ) : null}
                  {resultCount !== null ? (
                    <p className="m-0 text-[13px] leading-5 text-muted-foreground tabular-nums" aria-live="polite">
                      {stran(resultCount)}
                    </p>
                  ) : null}
                  <DropdownMenu>
                    <IconHint label="Zobraziť podľa">
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label="Zobraziť podľa"
                            className={cn(
                              "ml-auto size-7 rounded-lg border border-input bg-white text-[#303030] shadow-[0_1px_0_rgba(26,26,26,0.05),0_1px_2px_rgba(26,26,26,0.12)] hover:bg-[#f7f7f7] [&_svg]:size-4",
                              mode !== "type" && "border-primary text-primary"
                            )}
                          />
                        }
                      >
                        <List />
                      </DropdownMenuTrigger>
                    </IconHint>
                    <DropdownMenuContent align="end" className="min-w-[220px]">
                      <DropdownMenuRadioGroup value={mode} onValueChange={(value) => setMode(value as Mode)}>
                        <DropdownMenuLabel className="font-[550]!">Zobrazenie</DropdownMenuLabel>
                        {MODES.map((item) => (
                          <DropdownMenuRadioItem key={item.value} value={item.value}>
                            {item.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <NavigatorTree
                  pages={pages}
                  mode={mode}
                  query={query}
                  currentId={currentId}
                  onOpen={openPage}
                  onToggle={toggle}
                  onCollapseAll={collapseAll}
                  onHide={hide}
                  reorderId={reorderId}
                  reorderGroup={reorderGroup}
                  onReorder={(page, group) => reorder(page.id, group)}
                  onCancelReorder={cancelReorder}
                  onSaveReorder={saveReorder}
                  onMove={moveSibling}
                  onInsert={(name) => toast.add({ title: `Vloženie typu ${name} je v pôvodnej administrácii.` })}
                  onRetry={(id) =>
                    setPages((prev) => mapPages(prev, (page) => (page.id === id ? { ...page, load: "gaveup" } : page)))
                  }
                  onSuggest={(page) => setQuery(page.name)}
                />
              </CardContent>
            </Card>
          </section>
        ) : current ? (
          <PageDetail
            page={current}
            editorKey={editorKey}
            form={form}
            errors={errors}
            onForm={patchForm}
            onBack={goNav}
            onSoon={soon}
            onAskDelete={() => setDeleteOpen(true)}
            onGenerateUrl={() => patchForm({ seoUrl: `/blog/${slugFromName(form.name)}` })}
            onSave={save}
            onDiscard={discard}
            saving={saving}
            dirty={dirty}
            path={pagePath(pages, current.id)}
          />
        ) : null}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Presunúť stránku do archívu?</DialogTitle>
            <DialogDescription>
              {form.name.trim()
                ? `Stránka „${form.name.trim()}“ aj jej podstránky sa presunú do archívu. Z archívu ich viete vrátiť.`
                : "Stránka aj jej podstránky sa presunú do archívu. Z archívu ich viete vrátiť."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Zrušiť
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (currentId) {
                  setPages((prev) =>
                    mapPages(prev, (page) => (page.id === currentId ? { ...page, status: "hide" } : page))
                  )
                }
                setSnap(snapshotOf(form))
                setDeleteOpen(false)
                setView("nav")
                toast.add({ title: "Stránka je v archíve." })
              }}
            >
              Presunúť do archívu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
