"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, Bold, CalendarDays, Clock, Code, Italic, Link, List, Pencil } from "lucide-react"

import { IconHint } from "@/components/admin/icon-hint"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { sk } from "react-day-picker/locale"
import type { DateRange } from "react-day-picker"
import { pod, type PageNode } from "@/lib/pages"
import { cn } from "@/lib/utils"

export type FormState = {
  name: string
  html: string
  sourceMode: boolean
  source: string
  status: "pub" | "hide"
  publishedAt: string
  publishedUntil: string
  interesting: boolean
  news: boolean
  anno: string
  latest: string
  tagsTitle: string
  arch: string
  seoOpen: boolean
  metaDesc: string
  metaTitle: string
  tabTitle: string
  seoUrl: string
  noSeo: boolean
  promoValue: string
  extraValues: string[]
  fileName: string
  fileHint: string
  bgName: string
}

export function emptyForm(page: PageNode): FormState {
  const article = !!page.detail
  return {
    name: page.name,
    html: article
      ? "<p>Aenean eget tortor eget magna aliquet fermentum. In hac habitasse platea dictumst. Curabitur euismod lobortis porta.</p>"
      : "<p></p>",
    sourceMode: false,
    source: article
      ? "<p>Aenean eget tortor eget magna aliquet fermentum. In hac habitasse platea dictumst. Curabitur euismod lobortis porta.</p>"
      : "<p></p>",
    status: page.status,
    publishedAt: "2025-10-10T15:21",
    publishedUntil: "",
    interesting: true,
    news: false,
    anno: article ? "Aenean eget tortor eget magna aliquet fermentum" : "",
    latest: "",
    tagsTitle: "",
    arch: "",
    seoOpen: false,
    metaDesc: "",
    metaTitle: "",
    tabTitle: "",
    seoUrl: "/blog/ukazkovy-clanok-blogu-bez-kategorie-1",
    noSeo: false,
    promoValue: "",
    extraValues: [],
    fileName: "image_201_28_v1.jpeg",
    fileHint: "Obrázok článku. Presuňte súbor sem alebo ho vyberte.",
    bgName: "Obrázok nie je vybraný",
  }
}

function timeFromStamp(value: string) {
  return value.split("T")[1] || "00:00"
}

function dateFromStamp(value: string) {
  const [date] = value.split("T")
  if (!date) return undefined
  const [year, month, day] = date.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function stampFromDate(date: Date, time: string) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}T${time || "00:00"}`
}

function formatStamp(value: string) {
  const [date, time] = value.split("T")
  if (!date || !time) return value
  const [year, month, day] = date.split("-")
  const [hour, minute] = time.split(":")
  if (!year || !month || !day || !hour || !minute) return value
  return `${Number(day)}. ${Number(month)}. ${year}, ${hour}:${minute}`
}

function formatLongDate(value: string) {
  const date = dateFromStamp(value)
  if (!date) return ""
  return date.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" })
}

function formatVisibility(from: string, until: string) {
  const start = formatStamp(from)
  if (!until) return `Od ${start}`
  return `Od ${start} do ${formatStamp(until)}`
}

function VisibilitySchedule({
  from,
  until,
  open,
  onOpenChange,
  onChange,
}: {
  from: string
  until: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (next: { publishedAt?: string; publishedUntil?: string }) => void
}) {
  const [draftFrom, setDraftFrom] = useState(from)
  const [draftUntil, setDraftUntil] = useState(until)
  const [untilOn, setUntilOn] = useState(!!until)
  const fromDate = dateFromStamp(draftFrom)
  const untilDate = draftUntil ? dateFromStamp(draftUntil) : undefined

  useEffect(() => {
    if (!open) return
    setDraftFrom(from)
    setDraftUntil(until)
    setUntilOn(!!until)
  }, [open, from, until])

  function apply() {
    onChange({
      publishedAt: draftFrom,
      publishedUntil: untilOn && draftUntil ? draftUntil : "",
    })
    onOpenChange(false)
  }

  return (
    <div className="mt-1 flex items-start gap-1">
      <p className="min-w-0 text-xs leading-4 text-muted-foreground">{formatVisibility(from, until)}</p>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <IconHint label="Dátum zverejnenia" disabled={open}>
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="-mt-0.5 shrink-0 text-muted-foreground"
                aria-label="Upraviť dátum zverejnenia"
              />
            }
          >
            <Pencil />
          </DialogTrigger>
        </IconHint>
        <DialogContent className="inset-0 m-auto h-fit w-[min(680px,calc(100%-2rem))] max-w-none translate-none animate-none gap-0 overflow-hidden bg-popover p-0 sm:max-w-none">
          <DialogHeader className="border-b px-4 py-3 pr-12">
            <DialogTitle>Nastaviť dátum zverejnenia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-4 py-4">
            <DialogDescription>
              {untilOn
                ? "Stránka bude viditeľná v tomto rozsahu."
                : "Stránka bude viditeľná od tohto dátumu a času."}
            </DialogDescription>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-input px-3">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-[13px] leading-5">{formatLongDate(draftFrom)}</span>
              </div>
              <div className="flex h-10 items-center gap-2 rounded-lg border border-input px-3">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <input
                  type="time"
                  aria-label="Čas od"
                  className="min-w-0 flex-1 bg-transparent text-[13px] leading-5 outline-none [&::-webkit-calendar-picker-indicator]:hidden"
                  value={timeFromStamp(draftFrom)}
                  onChange={(event) => fromDate && setDraftFrom(stampFromDate(fromDate, event.target.value))}
                />
                <span className="shrink-0 text-xs text-muted-foreground">GMT+2</span>
              </div>
            </div>
            {untilOn ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex h-10 items-center gap-2 rounded-lg border border-input px-3">
                  <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[13px] leading-5">{draftUntil ? formatLongDate(draftUntil) : "Vyberte koniec"}</span>
                </div>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-input px-3">
                  <Clock className="size-4 shrink-0 text-muted-foreground" />
                  <input
                    type="time"
                    aria-label="Čas do"
                    className="min-w-0 flex-1 bg-transparent text-[13px] leading-5 outline-none [&::-webkit-calendar-picker-indicator]:hidden"
                    value={draftUntil ? timeFromStamp(draftUntil) : "23:59"}
                    onChange={(event) => untilDate && setDraftUntil(stampFromDate(untilDate, event.target.value))}
                  />
                  <span className="shrink-0 text-xs text-muted-foreground">GMT+2</span>
                </div>
              </div>
            ) : null}
            <label className="flex w-fit items-center gap-2 text-[13px] leading-5">
              <Checkbox
                checked={untilOn}
                onCheckedChange={(checked) => {
                  const next = !!checked
                  setUntilOn(next)
                  if (!next) setDraftUntil("")
                }}
              />
              Do
            </label>
            {untilOn ? (
              <Calendar
                key="range"
                mode="range"
                numberOfMonths={2}
                locale={sk}
                weekStartsOn={1}
                defaultMonth={fromDate}
                className="relative w-full p-0"
                classNames={{ months: "flex flex-row gap-4" }}
                selected={{ from: fromDate, to: untilDate }}
                onSelect={(range: DateRange | undefined) => {
                  if (!range?.from) return
                  setDraftFrom(stampFromDate(range.from, timeFromStamp(draftFrom)))
                  setDraftUntil(range.to ? stampFromDate(range.to, draftUntil ? timeFromStamp(draftUntil) : "23:59") : "")
                }}
              />
            ) : (
              <Calendar
                key="single"
                mode="single"
                numberOfMonths={2}
                locale={sk}
                weekStartsOn={1}
                defaultMonth={fromDate}
                className="relative w-full p-0"
                classNames={{ months: "flex flex-row gap-4" }}
                selected={fromDate}
                onSelect={(date) => {
                  if (!date) return
                  setDraftFrom(stampFromDate(date, timeFromStamp(draftFrom)))
                }}
              />
            )}
          </div>
          <DialogFooter className="mx-0 mb-0 bg-background px-4 pt-4 pr-6 pb-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="button" onClick={apply}>
              Nastaviť
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PositionTree({ path, name, kids }: { path: PageNode[]; name: string; kids: number }) {
  const labels = path.length ? path.map((node, index) => (index === path.length - 1 ? name : node.name)) : [name]
  const chain = ["Web", ...labels].map((label, index, all) => ({
    label,
    current: index === all.length - 1,
  }))
  return (
    <div>
      {chain.map((node, depth) => (
        <div
          key={depth}
          className={cn("limb", node.current && "mark")}
          style={{ ["--bar" as string]: `${8 + depth * 16}px`, paddingLeft: 8 + depth * 16 + 12 }}
        >
          {depth > 0 ? <span className="rail" style={{ left: 8 + (depth - 1) * 16 + 6 }} aria-hidden /> : null}
          <span className="min-w-0 truncate text-[13px] leading-5">{node.label}</span>
          {node.current && kids > 0 ? (
            <span className="ml-auto shrink-0 text-xs leading-4 text-muted-foreground">{pod(kids)}</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function PageDetail({
  page,
  editorKey,
  form,
  errors,
  onForm,
  onBack,
  onSoon,
  onAskDelete,
  onGenerateUrl,
  onSave,
  onDiscard,
  saving,
  dirty,
  path,
}: {
  page: PageNode
  editorKey: string
  form: FormState
  errors: Record<string, string>
  onForm: (next: Partial<FormState>) => void
  onBack: () => void
  onSoon: () => void
  onAskDelete: () => void
  onGenerateUrl: () => void
  onSave: () => void
  onDiscard: () => void
  saving: boolean
  dirty: boolean
  path: PageNode[]
}) {
  const article = !!page.detail
  const editorRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bgRef = useRef<HTMLInputElement>(null)
  const kids = page.children || 0
  const [editingPublishedAt, setEditingPublishedAt] = useState(false)

  useEffect(() => {
    setEditingPublishedAt(false)
  }, [page.id])

  function exec(cmd: string) {
    if (form.sourceMode) return
    editorRef.current?.focus()
    if (cmd === "link") {
      const url = window.prompt("Adresa odkazu")
      if (url) document.execCommand("createLink", false, url)
    } else {
      document.execCommand(cmd, false)
    }
    onForm({ html: editorRef.current?.innerHTML || form.html })
  }

  return (
    <section className="p-6 xl:mx-auto xl:w-[min(1120px,calc(100%-48px))]">
      <div className="mb-4 flex items-start gap-4 max-sm:flex-col">
        <div className="flex items-start gap-3">
          <IconHint label="Späť">
            <Button
              variant="outline"
              size="icon-sm"
              className="-mt-0.5 size-7 shrink-0 rounded-lg border border-input bg-white text-[#303030] shadow-[0_1px_0_rgba(26,26,26,0.05),0_1px_2px_rgba(26,26,26,0.12)] hover:bg-[#f7f7f7] [&_svg]:size-4"
              aria-label="Späť na navigátor"
              onClick={onBack}
            >
              <ArrowLeft />
            </Button>
          </IconHint>
          <div>
            <h1 className="text-xl leading-6 font-bold">{form.name.trim() || "Bez názvu"}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs leading-4 text-muted-foreground">
              <span className="font-medium">{article || (page.parent === "Blog" && page.id !== 231) ? "Článok blogu" : page.type || "Stránka"}</span>
              <Badge variant="secondary" className="h-6 rounded-full">
                #{page.id}
              </Badge>
              {article ? <span>10. 10. 2025, 15:21</span> : null}
            </p>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 gap-2 max-sm:ml-0 max-sm:w-full">
          <Button variant="outline" size="compact" render={<a href="https://demo.buxus.sk/blog/ukazkovy-clanok-blogu-bez-kategorie-1" target="_blank" rel="noopener" />} className="max-sm:flex-1">
            Zobraziť na webe
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="compact" className="max-sm:flex-1" />}>
              Ďalšie akcie
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuItem onClick={onSoon}>Duplikovať</DropdownMenuItem>
              <DropdownMenuItem onClick={onSoon}>Vystrihnúť</DropdownMenuItem>
              <DropdownMenuItem onClick={onSoon}>Skopírovať</DropdownMenuItem>
              <DropdownMenuItem onClick={onSoon}>Zmeniť typ</DropdownMenuItem>
              <DropdownMenuItem onClick={onSoon}>Nastaviť šablónu</DropdownMenuItem>
              <DropdownMenuItem onClick={onSoon}>Nastaviť práva</DropdownMenuItem>
              <DropdownMenuItem onClick={onSoon}>Nastaviť vkladanie</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onAskDelete}>
                Odstrániť
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {dirty ? (
        <div className="sticky top-14 z-20 mb-6 flex min-h-16 items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-background">
          <span className="flex-1">Neuložené zmeny</span>
          <Button variant="ghost" className="text-background hover:bg-white/12 hover:text-background" onClick={onDiscard}>
            Zahodiť
          </Button>
          <Button disabled={saving} onClick={onSave}>
            {saving ? "Ukladám…" : "Uložiť"}
          </Button>
        </div>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Obsah</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field data-invalid={!!errors.name || undefined}>
                <FieldLabel htmlFor="name">Názov</FieldLabel>
                <Input
                  id="name"
                  value={form.name}
                  aria-invalid={!!errors.name}
                  onChange={(e) => onForm({ name: e.target.value })}
                />
                {errors.name ? <FieldError>{errors.name}</FieldError> : null}
              </Field>
              <div>
                <p className="mb-2 text-[13px] leading-5 font-medium">Text</p>
                <div className="overflow-hidden rounded-lg border border-input">
                  <div className="flex items-center gap-1 border-b bg-muted/50 p-1" role="toolbar" aria-label="Formát textu">
                    <IconHint label="Tučné">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Tučné" disabled={form.sourceMode} onClick={() => exec("bold")}>
                        <Bold />
                      </Button>
                    </IconHint>
                    <IconHint label="Kurzíva">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Kurzíva" disabled={form.sourceMode} onClick={() => exec("italic")}>
                        <Italic />
                      </Button>
                    </IconHint>
                    <IconHint label="Zoznam">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Zoznam" disabled={form.sourceMode} onClick={() => exec("insertUnorderedList")}>
                        <List />
                      </Button>
                    </IconHint>
                    <IconHint label="Odkaz">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label="Odkaz" disabled={form.sourceMode} onClick={() => exec("link")}>
                        <Link />
                      </Button>
                    </IconHint>
                    <span className="flex-1" />
                    <IconHint label={form.sourceMode ? "Text" : "Zdroj"}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={form.sourceMode ? "Text" : "Zdroj"}
                        onClick={() => {
                          if (!form.sourceMode) onForm({ sourceMode: true, source: form.html })
                          else onForm({ sourceMode: false, html: form.source || "<p></p>" })
                        }}
                      >
                        <Code />
                      </Button>
                    </IconHint>
                  </div>
                  {form.sourceMode ? (
                    <Textarea
                      aria-label="Zdroj textu"
                      className="min-h-40 rounded-none border-0"
                      value={form.source}
                      onChange={(e) => onForm({ source: e.target.value, html: e.target.value })}
                    />
                  ) : (
                    <div
                      key={editorKey}
                      ref={editorRef}
                      className="min-h-40 px-3 py-2 text-[13px] leading-5 outline-none"
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => onForm({ html: e.currentTarget.innerHTML })}
                      dangerouslySetInnerHTML={{ __html: form.html }}
                    />
                  )}
                </div>
              </div>
              <div
                className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-input p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files?.[0]
                  if (file) onForm({ fileName: file.name, fileHint: "Súbor je vybraný." })
                }}
              >
                <div className="flex-1">
                  <div className="text-[13px] leading-5 font-medium">{form.fileName}</div>
                  <p className="text-xs leading-4 text-muted-foreground">{form.fileHint}</p>
                </div>
                <Button variant="outline" type="button" onClick={() => fileRef.current?.click()}>
                  Vybrať obrázok
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onForm({ fileName: file.name, fileHint: "Súbor je vybraný." })
                  }}
                />
              </div>
              {article ? (
                <div>
                  <p className="mb-2 text-[13px] leading-5 font-medium">Štítky</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex min-h-9 items-center gap-2 text-[13px] leading-5">
                      <Checkbox checked={form.interesting} onCheckedChange={(v) => onForm({ interesting: !!v })} />
                      Zaujímavosti
                    </label>
                    <label className="flex min-h-9 items-center gap-2 text-[13px] leading-5">
                      <Checkbox checked={form.news} onCheckedChange={(v) => onForm({ news: !!v })} />
                      Novinky
                    </label>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {article || page.id === 269 ? (
            <Card>
              <CardHeader>
                <CardTitle>Anotácia</CardTitle>
              </CardHeader>
              <CardContent>
                <Field>
                  <FieldLabel htmlFor="anno">
                    Krátky text <span className="font-normal text-muted-foreground">(nepovinné)</span>
                  </FieldLabel>
                  <Textarea id="anno" value={form.anno} onChange={(e) => onForm({ anno: e.target.value })} />
                  <FieldDescription>Zobrazí sa v zozname článkov, nie v tele stránky.</FieldDescription>
                </Field>
              </CardContent>
            </Card>
          ) : null}

          {article ? (
            <Card>
              <CardHeader>
                <CardTitle>Pravý stĺpec</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="latest">
                      Názov posledných článkov <span className="font-normal text-muted-foreground">(nepovinné)</span>
                    </FieldLabel>
                    <Input id="latest" value={form.latest} onChange={(e) => onForm({ latest: e.target.value })} />
                    <FieldDescription>Nadpis zoznamu posledných článkov v pravom stĺpci.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tags">
                      Názov štítkov <span className="font-normal text-muted-foreground">(nepovinné)</span>
                    </FieldLabel>
                    <Input id="tags" value={form.tagsTitle} onChange={(e) => onForm({ tagsTitle: e.target.value })} />
                    <FieldDescription>Nadpis zoznamu štítkov v pravom stĺpci.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="arch">
                      Názov archívu <span className="font-normal text-muted-foreground">(nepovinné)</span>
                    </FieldLabel>
                    <Input id="arch" value={form.arch} onChange={(e) => onForm({ arch: e.target.value })} />
                    <FieldDescription>Nadpis archívu v pravom stĺpci.</FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-md bg-muted p-3">
                <p className="flex-1 text-[13px] leading-5">Zdedené zo šablóny. Vlastné hodnoty nastavíte, keď ich táto stránka potrebuje iné.</p>
                <Button variant="outline" size="compact" onClick={() => onForm({ seoOpen: !form.seoOpen })}>
                  {form.seoOpen ? "Skryť vlastné SEO" : "Upraviť na tejto stránke"}
                </Button>
              </div>
              {form.seoOpen ? (
                <FieldGroup>
                  <Field data-invalid={!!errors.metaDesc || undefined}>
                    <FieldLabel htmlFor="meta-desc">
                      Popis <span className="font-normal text-muted-foreground">(nepovinné)</span>
                    </FieldLabel>
                    <Textarea id="meta-desc" rows={3} aria-invalid={!!errors.metaDesc} value={form.metaDesc} onChange={(e) => onForm({ metaDesc: e.target.value })} />
                    <FieldDescription>{form.metaDesc.length} / 170 znakov.</FieldDescription>
                    {errors.metaDesc ? <FieldError>{errors.metaDesc}</FieldError> : null}
                  </Field>
                  <Field data-invalid={!!errors.metaTitle || undefined}>
                    <FieldLabel htmlFor="meta-title">
                      Titulok <span className="font-normal text-muted-foreground">(nepovinné)</span>
                    </FieldLabel>
                    <Input id="meta-title" aria-invalid={!!errors.metaTitle} value={form.metaTitle} onChange={(e) => onForm({ metaTitle: e.target.value })} />
                    <FieldDescription>{form.metaTitle.length} / 35 znakov. Text v záložke prehliadača má strop 65.</FieldDescription>
                    {errors.metaTitle ? <FieldError>{errors.metaTitle}</FieldError> : null}
                  </Field>
                  <Field data-invalid={!!errors.tabTitle || undefined}>
                    <FieldLabel htmlFor="tab-title">
                      Názov v záložke <span className="font-normal text-muted-foreground">(nepovinné)</span>
                    </FieldLabel>
                    <Input id="tab-title" aria-invalid={!!errors.tabTitle} value={form.tabTitle} onChange={(e) => onForm({ tabTitle: e.target.value })} />
                    <FieldDescription>{form.tabTitle.length} / 65 znakov.</FieldDescription>
                    {errors.tabTitle ? <FieldError>{errors.tabTitle}</FieldError> : null}
                  </Field>
                  <Field data-invalid={!!errors.seoUrl || undefined}>
                    <FieldLabel htmlFor="seo-url">
                      SEO adresa <span className="font-normal text-muted-foreground">(nepovinné)</span>
                    </FieldLabel>
                    <Input id="seo-url" disabled={form.noSeo} aria-invalid={!!errors.seoUrl} value={form.seoUrl} onChange={(e) => onForm({ seoUrl: e.target.value })} />
                    {errors.seoUrl ? <FieldError>{errors.seoUrl}</FieldError> : null}
                  </Field>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" type="button" onClick={onGenerateUrl}>
                      Generovať z názvu
                    </Button>
                    <label className="flex min-h-9 items-center gap-2 text-[13px] leading-5">
                      <Checkbox checked={form.noSeo} onCheckedChange={(v) => onForm({ noSeo: !!v })} />
                      Nepoužiť SEO adresu
                    </label>
                  </div>
                </FieldGroup>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pozadie promoboxu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field>
                <FieldLabel htmlFor="promo">
                  Hodnota <span className="font-normal text-muted-foreground">(nepovinné)</span>
                </FieldLabel>
                <Input id="promo" value={form.promoValue} onChange={(e) => onForm({ promoValue: e.target.value })} />
              </Field>
              <Button variant="outline" type="button" onClick={() => onForm({ extraValues: [...form.extraValues, ""] })}>
                Pridať hodnotu
              </Button>
              {form.extraValues.map((value, i) => (
                <Field key={i}>
                  <FieldLabel>
                    Ďalšia hodnota <span className="font-normal text-muted-foreground">(nepovinné)</span>
                  </FieldLabel>
                  <Input
                    value={value}
                    onChange={(e) => {
                      const next = [...form.extraValues]
                      next[i] = e.target.value
                      onForm({ extraValues: next })
                    }}
                  />
                </Field>
              ))}
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-input p-3">
                <div className="flex-1">
                  <div className="text-[13px] leading-5 font-medium">{form.bgName}</div>
                  <p className="text-xs leading-4 text-muted-foreground">Výška najviac 130 px, šírka najviac 150 px.</p>
                </div>
                <Button variant="outline" type="button" onClick={() => bgRef.current?.click()}>
                  Vybrať obrázok pozadia
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={form.bgName === "Obrázok nie je vybraný"}
                  onClick={() => onForm({ bgName: "Obrázok nie je vybraný" })}
                >
                  Odstrániť obrázok
                </Button>
                <input
                  ref={bgRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) onForm({ bgName: file.name })
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stav</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={form.status}
                onValueChange={(status) => {
                  if (status === "pub" || status === "hide") onForm({ status })
                  if (status === "hide") setEditingPublishedAt(false)
                }}
                aria-label="Stav"
                className="gap-3"
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="pub" id="status-pub" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="status-pub" className="text-[13px] leading-5 font-medium">
                      Viditeľné
                    </label>
                    {form.status === "pub" ? (
                      <VisibilitySchedule
                        from={form.publishedAt}
                        until={form.publishedUntil}
                        open={editingPublishedAt}
                        onOpenChange={setEditingPublishedAt}
                        onChange={onForm}
                      />
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="hide" id="status-hide" />
                  <label htmlFor="status-hide" className="text-[13px] leading-5 font-medium">
                    Skryté
                  </label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pozícia</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <PositionTree path={path} name={form.name.trim() || "Bez názvu"} kids={kids} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  )
}
