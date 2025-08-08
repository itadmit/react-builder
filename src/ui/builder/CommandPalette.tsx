import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { WIDGETS } from '@/widgets/registry'
import { Trash2 } from 'lucide-react'
import { useBuilderStore } from '@/store/useBuilderStore'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const addWidget = useBuilderStore((s) => s.addWidget)
  const clearPage = useBuilderStore((s) => s.clearPage)
  const page = useBuilderStore((s) => s.page)

  useEffect(() => {
    const onEvent = (e: any) => setOpen(!!e.detail?.open)
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('qs:command', onEvent as any)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('qs:command', onEvent as any)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const firstSectionId = page.sections[0]?.id
  const results = useMemo(() => WIDGETS.filter(w => w.label.includes(q)), [q])
  const commands = useMemo(() => {
    const items: Array<{ key: string; label: string; icon: React.ReactNode; action: () => void }> = []
    const hay = q.trim()
    function include(label: string) { return hay === '' || label.includes(hay) }
    if (include('טען תבנית') || include('תבנית') || include('טעון')) items.push({ key: 'open-templates', label: 'טען תבנית (פתח מודל תבניות)', icon: <span>📦</span>, action: () => window.dispatchEvent(new CustomEvent('qs:toolbar', { detail: { action: 'openTemplates' } })) })
    if (include('שמור')) items.push({ key: 'save', label: 'שמור (Draft)', icon: <span>💾</span>, action: () => window.dispatchEvent(new CustomEvent('qs:toolbar', { detail: { action: 'save' } })) })
    if (include('פרסום') || include('פרסם')) items.push({ key: 'publish', label: 'פרסום (Publish)', icon: <span>🚀</span>, action: () => window.dispatchEvent(new CustomEvent('qs:toolbar', { detail: { action: 'publish' } })) })
    if (include('מחק הכל')) items.push({ key: 'clear-all', label: 'מחק הכל (נקה עמוד)', icon: <Trash2 size={20} />, action: () => { if (confirm('למחוק את כל התוכן בעמוד?')) clearPage() } })
    return items
  }, [q, clearPage])

  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-24 z-50" onClick={() => setOpen(false)}>
      <div className="w-[640px] rounded-xl bg-white shadow-2xl border" onClick={(e) => e.stopPropagation()}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="חפש פקודה או אלמנט" className="w-full h-12 px-5 text-lg border-b outline-none" />
        <div className="max-h-96 overflow-y-auto">
          {commands.map(c => (
            <button key={c.key} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50" onClick={() => { c.action(); setOpen(false) }}>
              {c.icon}
              <span className="text-base">{c.label}</span>
            </button>
          ))}
          {results.map(r => (
            <button key={r.type} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50" onClick={() => {
              if (firstSectionId) addWidget(firstSectionId, r.create())
              setOpen(false)
            }}>
              <r.icon size={20} />
              <span className="text-base">{r.label}</span>
            </button>
          ))}
          {results.length === 0 && commands.length === 0 && <div className="p-4 text-sm text-zinc-500">אין תוצאות</div>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

