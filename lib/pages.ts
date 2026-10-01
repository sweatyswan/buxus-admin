import pagesData from "./pages.json"

export type PageStatus = "pub" | "hide"

export type PageNode = {
  name: string
  id: number
  type?: string
  status: PageStatus
  parent?: string
  kids?: PageNode[]
  children?: number
  open?: boolean
  detail?: boolean
  group?: string
  load?: "gaveup" | "fail"
}

export const ARTICLE_HTML =
  "<p>Aenean eget tortor eget magna aliquet fermentum. In hac habitasse platea dictumst. Curabitur euismod lobortis porta.</p>"

export const ROOT_PAGES = pagesData as PageNode[]

export function clonePages(pages: PageNode[] = ROOT_PAGES): PageNode[] {
  return structuredClone(pages)
}

export function fold(value: string) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function pod(n: number) {
  if (n === 1) return "1 podstránka"
  if (n >= 2 && n <= 4) return `${n} podstránky`
  return `${n} podstránok`
}

export function stran(n: number) {
  if (n === 1) return "1 stránka"
  if (n >= 2 && n <= 4) return `${n} stránky`
  return `${n} stránok`
}

const MONTHS = ["jan", "feb", "mar", "apr", "máj", "jún", "júl", "aug", "sep", "okt", "nov", "dec"]

export function editedLabel(page: { id: number }) {
  if (page.id === 270) return "10. okt 15:21"
  const day = (page.id % 27) + 1
  const month = MONTHS[page.id % 12]
  const hour = 8 + (page.id % 12)
  const minute = String((page.id * 7) % 60).padStart(2, "0")
  return `${day}. ${month} ${hour}:${minute}`
}

export function flatten(nodes: PageNode[]): PageNode[] {
  const list: PageNode[] = []
  const walk = (items: PageNode[] = []) => {
    items.forEach((page) => {
      list.push(page)
      walk(page.kids)
    })
  }
  walk(nodes)
  return list
}

export function findPage(nodes: PageNode[], id: number | string) {
  return flatten(nodes).find((page) => String(page.id) === String(id))
}

export function orderByIds(nodes: PageNode[], ids: number[]): PageNode[] {
  const byId = new Map(nodes.map((page) => [page.id, page]))
  const ordered = ids.flatMap((id) => {
    const page = byId.get(id)
    return page ? [page] : []
  })
  const rest = nodes.filter((page) => !ids.includes(page.id))
  return [...ordered, ...rest]
}

export function moveItem(nodes: PageNode[], fromId: number, toId: number): PageNode[] {
  const from = nodes.findIndex((page) => page.id === fromId)
  const to = nodes.findIndex((page) => page.id === toId)
  if (from < 0 || to < 0 || from === to) return nodes
  const next = nodes.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function mapPages(nodes: PageNode[], fn: (page: PageNode) => PageNode): PageNode[] {
  return nodes.map((page) => {
    const next = fn(page)
    return { ...next, kids: next.kids ? mapPages(next.kids, fn) : next.kids }
  })
}

function dist(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i] as number[])
  for (let j = 0; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

export function matches(page: PageNode, query: string) {
  if (!query) return true
  const slug = fold(page.name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "stranka"
  return fold(`${page.name} ${page.id} ${page.type || ""} ${page.group || ""} ${slug} /${slug}`).includes(fold(query))
}

export function hasMatch(page: PageNode, query: string): boolean {
  if (!query) return true
  if (matches(page, query)) return true
  return (page.kids || []).some((kid) => hasMatch(kid, query))
}

export function suggest(nodes: PageNode[], query: string): PageNode | null {
  const needle = fold(query)
  let best: PageNode | null = null
  let bestD = 3
  for (const page of flatten(nodes)) {
    for (const word of fold(page.name).split(/\s+/)) {
      const d = dist(needle, word)
      if (d < bestD) {
        bestD = d
        best = page
      }
    }
  }
  return bestD <= 2 ? best : null
}

export function pagePath(nodes: PageNode[], id: number): PageNode[] {
  const walk = (items: PageNode[], trail: PageNode[]): PageNode[] | null => {
    for (const item of items) {
      const next = [...trail, item]
      if (item.id === id) return next
      if (item.kids?.length) {
        const found = walk(item.kids, next)
        if (found) return found
      }
    }
    return null
  }
  return walk(nodes, []) ?? []
}

export function slugFromName(name: string) {
  return fold(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "stranka"
}

export function previewUrl(page: PageNode) {
  if (page.id === 1) return "https://demo.buxus.sk/"
  const slug = slugFromName(page.name)
  if (page.detail || page.type === "Článok blogu" || page.group === "Článok blogu") {
    return `https://demo.buxus.sk/blog/${slug}`
  }
  return `https://demo.buxus.sk/${slug}`
}
