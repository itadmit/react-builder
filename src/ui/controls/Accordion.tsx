import React, { useState } from 'react'

type Item = {
  id: string
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function Accordion({ items }: { items: Item[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(items.filter((i) => i.defaultOpen).map((i) => i.id)),
  )

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="divide-y rounded-lg border bg-white overflow-visible">
      {items.map((i) => (
        <div key={i.id} className="relative">
          <button
            className="w-full flex items-center justify-between px-3 py-3 text-sm hover:bg-zinc-50"
            onClick={() => toggle(i.id)}
          >
            <span className="font-medium text-zinc-800">{i.title}</span>
            <span className="text-zinc-500">
              {openIds.has(i.id) ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M8 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
          </button>
          {openIds.has(i.id) && <div className="p-3 relative z-0">{i.children}</div>}
        </div>
      ))}
    </div>
  )
}

