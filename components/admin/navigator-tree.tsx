"use client"

import { useEffect, useState } from "react"

let draggingId: number | null = null
import { GripVertical, ListCollapse } from "@keyline-icons/react"
import { ChevronRight, Eye } from "lucide-react"

import { IconHint } from "@/components/admin/icon-hint"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { editedLabel, flatten, hasMatch, pod, previewUrl, stran, suggest, type PageNode } from "@/lib/pages"
import { cn } from "@/lib/utils"

const INDENT = 16
const STEP = 20

function Rails({ depth }: { depth: number }) {
  return (
    <>
      {Array.from({ length: depth }, (_, i) => (
        <span key={i} className="rail" style={{ left: INDENT + i * STEP + 12 }} aria-hidden />
      ))}
    </>
  )
}

function TreeHead({ canCollapse, onCollapse }: { canCollapse?: boolean; onCollapse?: () => void }) {
  return (
    <div className="tree-head" role="row">
      <div className="tree-name gap-5" style={{ paddingLeft: INDENT }}>
        {canCollapse && onCollapse ? (
          <IconHint label="Zbaliť všetko">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 shrink-0 text-muted-foreground [&_svg]:size-4"
              aria-label="Zbaliť všetko"
              onClick={onCollapse}
            >
              <ListCollapse />
            </Button>
          </IconHint>
        ) : (
          <span className="inline-flex size-7 shrink-0" aria-hidden />
        )}
        <span>Názov</span>
      </div>
      <span className="tree-id">ID</span>
      <span className="tree-status">Stav</span>
      <span className="tree-kids">Podstránky</span>
      <span className="tree-date">Upravené</span>
      <span />
    </div>
  )
}

function StatusBadge({ status }: { status: PageNode["status"] }) {
  return status === "hide" ? (
    <Badge className="h-6 rounded-full border-0 bg-[#d4ecfc] px-2.5 text-[13px] leading-5 font-semibold text-[#003858]">
      Skryté
    </Badge>
  ) : (
    <Badge className="h-6 rounded-full border-0 bg-[#b0fcc0] px-2.5 text-[13px] leading-5 font-semibold text-[#004840]">
      Viditeľné
    </Badge>
  )
}

function PageRow({
  page,
  depth,
  marked,
  sortable,
  editing,
  onOpen,
  onToggle,
  onHide,
  onMove,
  onCancelReorder,
  onSaveReorder,
}: {
  page: PageNode
  depth: number
  marked?: boolean
  sortable?: boolean
  editing?: boolean
  onOpen: (page: PageNode, rename?: boolean) => void
  onToggle: (id: number) => void
  onHide: (page: PageNode) => void
  onMove?: (fromId: number, toId: number) => void
  onCancelReorder?: () => void
  onSaveReorder?: () => void
}) {
  const [over, setOver] = useState(false)
  const [dragging, setDragging] = useState(false)
  const canOpen = !!(page.kids && page.kids.length) || page.children === 0
  useEffect(() => {
    const clear = () => setOver(false)
    window.addEventListener("dragend", clear)
    return () => window.removeEventListener("dragend", clear)
  }, [])
  const pad = INDENT + depth * STEP
  return (
    <div
      className={cn(
        "tree-row relative min-h-9 rounded-md pr-6",
        marked && "mark",
        editing && "reorder",
        dragging && "dragging",
        over && "drop"
      )}
      style={{ ["--bar" as string]: `${pad + 36}px` }}
      onDragOver={(event) => {
        if (!sortable || draggingId === page.id) return
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        if (!sortable || !onMove) return
        event.preventDefault()
        setOver(false)
        const fromId = Number(event.dataTransfer.getData("text/plain"))
        if (fromId && fromId !== page.id) onMove(fromId, page.id)
      }}
    >
      <div className="tree-name gap-5" style={{ paddingLeft: pad }}>
        <Rails depth={depth} />
        {sortable ? (
          <IconHint label="Presunúť">
            <Button
              variant="ghost"
              size="icon-sm"
              draggable
              className="size-7 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing [&_svg]:size-4"
              aria-label="Presunúť"
              onDragStart={(event) => {
                draggingId = page.id
                setDragging(true)
                event.dataTransfer.setData("text/plain", String(page.id))
                event.dataTransfer.effectAllowed = "move"
              }}
              onDragEnd={() => {
                draggingId = null
                setDragging(false)
              }}
            >
              <GripVertical />
            </Button>
          </IconHint>
        ) : null}
        {canOpen ? (
          <IconHint label={page.open ? "Zbaliť" : "Rozbaliť"}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 shrink-0 text-muted-foreground"
              aria-label={page.open ? "Zbaliť" : "Rozbaliť"}
              aria-expanded={!!page.open}
              onClick={() => onToggle(page.id)}
            >
              <ChevronRight className={cn("size-4 transition-transform", page.open && "rotate-90")} />
            </Button>
          </IconHint>
        ) : (
          <span className="inline-flex size-7 shrink-0" aria-hidden />
        )}
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            className="min-w-0 truncate text-left text-[13px] leading-5 font-semibold"
            onClick={() => onOpen(page)}
          >
            {page.name}
          </button>
          <IconHint label="Náhľad">
            <Button
              variant="ghost"
              size="icon-sm"
              nativeButton={false}
              render={<a href={previewUrl(page)} target="_blank" rel="noopener" />}
              className="preview size-7 shrink-0 text-muted-foreground"
              aria-label={`Náhľad: ${page.name}`}
            >
              <Eye className="size-4" />
            </Button>
          </IconHint>
        </div>
      </div>
      <div className="tree-id">
        <Badge variant="secondary" className="h-6 rounded-full px-2 text-[13px] leading-5 font-medium">
          #{page.id}
        </Badge>
      </div>
      <div className="tree-status">
        <StatusBadge status={page.status} />
      </div>
      <div className="tree-kids">
        {page.children ? pod(page.children) : ""}
      </div>
      <div className="tree-date">{editedLabel(page)}</div>
      <div className="rel tree-act relative flex justify-end gap-2">
        {editing ? (
          <>
            <Button variant="outline" size="compact" onClick={onCancelReorder}>
              Zrušiť
            </Button>
            <Button size="compact" onClick={onSaveReorder}>
              Uložiť
            </Button>
          </>
        ) : sortable ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="compact" className="relative before:absolute before:inset-y-[-8px] before:inset-x-0" />}
            >
              Akcie
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px]">
              <DropdownMenuItem onClick={() => onOpen(page)}>Upraviť</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpen(page, true)}>Premenovať</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onHide(page)}>
                {page.status === "hide" ? "Zverejniť" : "Skryť"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

function GroupBar({
  name,
  count,
  depth,
  sorting,
  onInsert,
  onReorder,
  onCancel,
  onSave,
}: {
  name: string
  count: number
  depth: number
  sorting?: boolean
  onInsert: (name: string) => void
  onReorder?: () => void
  onCancel?: () => void
  onSave?: () => void
}) {
  const pad = INDENT + depth * STEP
  return (
    <div className="group-bar group pr-6" style={{ ["--bar" as string]: `${pad + 36}px` }}>
      <div className="tree-name gap-5" style={{ paddingLeft: pad }}>
        <Rails depth={depth} />
        <span className="inline-flex size-7 shrink-0" aria-hidden />
        <span className="truncate text-xs leading-4 font-medium text-muted-foreground">
          {name} <span>· {stran(count)}</span>
        </span>
      </div>
      <div className="tree-id" />
      <div className="tree-status" />
      <div className="tree-kids" />
      <div className="tree-date" />
      <div className="tree-act flex justify-end gap-2">
        {sorting ? (
          <>
            <Button variant="outline" size="compact" onClick={onCancel}>
              Zrušiť
            </Button>
            <Button size="compact" onClick={onSave}>
              Uložiť
            </Button>
          </>
        ) : (
          <>
            {count > 1 && onReorder ? (
              <Button
                variant="outline"
                size="compact"
                className="invisible whitespace-nowrap group-hover:visible group-focus-within:visible"
                onClick={onReorder}
              >
                Zmeniť poradie
              </Button>
            ) : null}
            <Button
              variant="soft"
              size="compact"
              className="invisible whitespace-nowrap group-hover:visible group-focus-within:visible"
              onClick={() => onInsert(name)}
            >
              Vložiť {name}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function BranchBody({
  page,
  onRetry,
  onInsert,
}: {
  page: PageNode
  onRetry: (id: number) => void
  onInsert: (name: string) => void
}) {
  if (page.kids && page.kids.length) return null
  if (page.children === 0) {
    return (
      <div className="mb-2 py-2 pr-2 pl-[calc(var(--line)+48px)]">
        <p className="text-[13px] leading-5">Ešte tu nič nie je.</p>
        <Button variant="soft" size="compact" onClick={() => onInsert("stránku")}>
          Vložiť stránku
        </Button>
      </div>
    )
  }
  if (!page.children) return null
  if (page.load === "gaveup") {
    return (
      <div className="mb-2 py-2 pr-2 pl-[calc(var(--line)+48px)]">
        <p className="text-[13px] leading-5">V prototype tieto podstránky nie sú.</p>
        <p className="text-xs leading-4 text-muted-foreground">Na deme ich vetva má. Tu je rozpísaný len Blog a článok #270.</p>
      </div>
    )
  }
  return (
    <div className="mb-2 py-2 pr-2 pl-[calc(var(--line)+48px)]">
      <p className="text-[13px] leading-5">Podstránky sa nepodarilo načítať.</p>
      <Button variant="link" className="h-8 px-0 text-[13px] leading-5" onClick={() => onRetry(page.id)}>
        Skúsiť znova
      </Button>
    </div>
  )
}

function RenderPage({
  page,
  depth,
  query,
  currentId,
  reorderId,
  reorderGroup,
  sortable,
  onOpen,
  onToggle,
  onHide,
  onInsert,
  onRetry,
  onReorder,
  onMove,
  onCancelReorder,
  onSaveReorder,
  grouped,
}: {
  page: PageNode
  depth: number
  query: string
  currentId?: number
  reorderId?: number | null
  reorderGroup?: string | null
  sortable?: boolean
  onOpen: (page: PageNode, rename?: boolean) => void
  onToggle: (id: number) => void
  onHide: (page: PageNode) => void
  onInsert: (name: string) => void
  onRetry: (id: number) => void
  onReorder?: (page: PageNode, group: string) => void
  onMove?: (fromId: number, toId: number) => void
  onCancelReorder?: () => void
  onSaveReorder?: () => void
  grouped: boolean
}) {
  const childHit = (page.kids || []).some((kid) => hasMatch(kid, query))
  const reordering = reorderId === page.id
  const open = query ? childHit : reordering || !!page.open
  const inner = page.kids?.length
    ? renderList(page.kids, depth + 1, grouped && !(reordering && !reorderGroup), {
        query,
        currentId,
        reorderId,
        reorderGroup,
        sortable: reordering && !reorderGroup,
        siblingParent: page,
        onOpen,
        onToggle,
        onHide,
        onInsert,
        onRetry,
        onReorder,
        onMove,
        onCancelReorder,
        onSaveReorder,
      })
    : open
      ? <BranchBody page={page} onRetry={onRetry} onInsert={onInsert} />
      : null
  return (
    <>
      <PageRow
        page={{ ...page, open }}
        depth={depth}
        marked={currentId === page.id}
        sortable={sortable}
        editing={reordering && !reorderGroup}
        onOpen={onOpen}
        onToggle={onToggle}
        onHide={onHide}
        onMove={onMove}
        onCancelReorder={onCancelReorder}
        onSaveReorder={onSaveReorder}
      />
      {open && inner ? (
        <div className="tree-branch" style={{ ["--line" as string]: `${INDENT + depth * STEP + 12}px` }}>
          <Rails depth={depth + 1} />
          {inner}
        </div>
      ) : null}
    </>
  )
}

function renderList(
  nodes: PageNode[],
  depth: number,
  grouped: boolean,
  ctx: {
    query: string
    currentId?: number
    reorderId?: number | null
    reorderGroup?: string | null
    sortable?: boolean
    siblingParent?: PageNode
    onOpen: (page: PageNode, rename?: boolean) => void
    onToggle: (id: number) => void
    onHide: (page: PageNode) => void
    onInsert: (name: string) => void
    onRetry: (id: number) => void
    onReorder?: (page: PageNode, group: string) => void
    onMove?: (fromId: number, toId: number) => void
    onCancelReorder?: () => void
    onSaveReorder?: () => void
  }
) {
  const visible = nodes.filter((page) => hasMatch(page, ctx.query))
  if (!grouped) {
    return visible.map((page) => (
      <RenderPage key={page.id} page={page} depth={depth} grouped={false} sortable={ctx.sortable} {...ctx} />
    ))
  }
  const order: string[] = []
  const buckets = new Map<string, PageNode[]>()
  visible.forEach((page) => {
    const group = page.type || page.group || "Stránka"
    if (!buckets.has(group)) {
      buckets.set(group, [])
      order.push(group)
    }
    buckets.get(group)!.push(page)
  })
  return order.map((group) => {
    const slice = buckets.get(group) || []
    return (
      <div key={`${depth}-${group}`}>
        <GroupBar
          name={group}
          count={slice.length}
          depth={depth}
          sorting={!!(ctx.reorderGroup === group && ctx.siblingParent && ctx.reorderId === ctx.siblingParent.id)}
          onInsert={ctx.onInsert}
          onReorder={
            slice.length > 1 && ctx.siblingParent && ctx.onReorder
              ? () => ctx.onReorder?.(ctx.siblingParent!, group)
              : undefined
          }
          onCancel={ctx.onCancelReorder}
          onSave={ctx.onSaveReorder}
        />
        {slice.map((page) => (
          <RenderPage
            key={page.id}
            page={page}
            depth={depth}
            grouped
            {...ctx}
            sortable={!!(ctx.reorderGroup === group && ctx.siblingParent && ctx.reorderId === ctx.siblingParent.id)}
          />
        ))}
      </div>
    )
  })
}

export function NavigatorTree({
  pages,
  mode,
  query,
  currentId,
  onOpen,
  onToggle,
  onHide,
  onInsert,
  onRetry,
  onSuggest,
  onCollapseAll,
  reorderId,
  reorderGroup,
  onReorder,
  onMove,
  onCancelReorder,
  onSaveReorder,
}: {
  pages: PageNode[]
  mode: "type" | "tree" | "prop"
  query: string
  currentId?: number
  onOpen: (page: PageNode, rename?: boolean) => void
  onToggle: (id: number) => void
  onHide: (page: PageNode) => void
  onInsert: (name: string) => void
  onRetry: (id: number) => void
  onSuggest: (page: PageNode) => void
  onCollapseAll: () => void
  reorderId?: number | null
  reorderGroup?: string | null
  onReorder?: (page: PageNode, group: string) => void
  onMove?: (parentId: number, fromId: number, toId: number) => void
  onCancelReorder?: () => void
  onSaveReorder?: () => void
}) {
  const [webOpen, setWebOpen] = useState(true)
  useEffect(() => {
    if (reorderId === 1) setWebOpen(true)
  }, [reorderId])
  const anyOpen = flatten(pages).some((page) => page.open) || (mode === "tree" && webOpen) || reorderId === 1
  function handleToggle(id: number) {
    if (id === 1) setWebOpen((open) => !open)
    else onToggle(id)
  }
  function handleCollapseAll() {
    setWebOpen(false)
    onCollapseAll()
  }
  function handleReorder(page: PageNode, group: string) {
    onReorder?.(page, group)
  }
  function handleMove(fromId: number, toId: number) {
    if (reorderId) onMove?.(reorderId, fromId, toId)
  }
  const ctx = {
    query,
    currentId,
    reorderId,
    reorderGroup,
    siblingParent: { id: 1, name: "Web", status: "pub" },
    onOpen,
    onToggle: handleToggle,
    onHide,
    onInsert,
    onRetry,
    onReorder: onReorder ? handleReorder : undefined,
    onMove: handleMove,
    onCancelReorder,
    onSaveReorder,
  }
  if (mode === "prop") {
    const unique = flatten(pages).filter((page) => page.detail && hasMatch(page, query))
    return (
      <div>
        <p className="mb-3 text-xs leading-4 text-muted-foreground">Stránky so štítkom Zaujímavosti.</p>
        {unique.length ? (
          <div className="tree">
            <TreeHead />
            {unique.map((page) => (
              <PageRow
                key={page.id}
                page={page}
                depth={0}
                marked={currentId === page.id}
                onOpen={onOpen}
                onToggle={onToggle}
                onHide={onHide}
              />
            ))}
          </div>
        ) : (
          <div className="py-4">
            <p className="text-[13px] leading-5">So štítkom Zaujímavosti tu zatiaľ nič nie je.</p>
            <p className="text-xs leading-4 text-muted-foreground">Štítok pridáte v detaile článku.</p>
          </div>
        )}
      </div>
    )
  }

  const shown = mode === "tree"
    ? [{ name: "Web", id: 1, status: "pub" as const, children: 11, kids: pages, open: webOpen }]
    : pages
  const visibleCount = shown.reduce((n, page) => n + (hasMatch(page, query) ? 1 : 0), 0)

  if (query && visibleCount === 0) {
    return (
      <EmptyQuery query={query} pages={pages} onSuggest={onSuggest} />
    )
  }

  return (
    <div className="tree">
      <TreeHead canCollapse={anyOpen} onCollapse={handleCollapseAll} />
      {mode === "tree"
        ? shown.map((page) => (
            <RenderPage key={page.id} page={page} depth={0} grouped={false} {...ctx} />
          ))
        : renderList(pages, 0, true, ctx)}
    </div>
  )
}

function EmptyQuery({
  query,
  pages,
  onSuggest,
}: {
  query: string
  pages: PageNode[]
  onSuggest: (page: PageNode) => void
}) {
  const s = suggest(pages, query)
  return (
    <div className="py-4">
      <p className="text-[13px] leading-5">Nič sa nenašlo.</p>
      {s ? (
        <p className="text-[13px] leading-5">
          Mysleli ste{" "}
          <Button variant="link" className="h-auto px-0 text-[13px] leading-5" onClick={() => onSuggest(s)}>
            {s.name}
          </Button>
          ?
        </p>
      ) : null}
      <p className="text-xs leading-4 text-muted-foreground">
        Skúste názov, číslo alebo časť adresy. Diakritika nie je potrebná.
      </p>
    </div>
  )
}
