import { useBuilderStore } from '@/store/useBuilderStore'
import type { Widget } from '@/types/builder'
import { WIDGETS } from '@/widgets/registry'
import { useMemo, useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { GripVertical, Trash2, ImageIcon, Type as TypeIcon, Plus, Layers, Blocks } from 'lucide-react'


export function Sidebar() {
  const page = useBuilderStore((s) => s.page)
  const addWidget = useBuilderStore((s) => s.addWidget)
  const addSection = useBuilderStore((s) => s.addSection)
  const selected = useBuilderStore((s) => s.selected)
  const [tab, setTab] = useState<'widgets' | 'layers'>('widgets')
  const [query, setQuery] = useState('')

  const firstSectionId = page.sections[0]?.id
  const currentSectionId = useMemo(() => {
    if (selected?.kind === 'section') return selected.id
    return firstSectionId
  }, [selected, firstSectionId])

  return (
    <aside className="h-full bg-white flex flex-col">
      <div className="border-b px-0 py-0 grid grid-cols-[1fr_auto] items-stretch gap-0">
        <div className="inline-flex w-full">
          <button className={`tab flex-1 ${tab === 'widgets' ? 'tab-active' : ''}`} onClick={() => setTab('widgets')}>
            <span className="inline-flex items-center gap-2"><Blocks size={16} /> אלמנטים</span>
          </button>
          <button className={`tab flex-1 ${tab === 'layers' ? 'tab-active' : ''}`} onClick={() => setTab('layers')}>
            <span className="inline-flex items-center gap-2"><Layers size={16} /> שכבות</span>
          </button>
        </div>
        <button className="btn rounded-none h-auto w-11 px-0 flex items-center justify-center" style={{ background: 'var(--qs-outline-strong)', color: '#fff' }} onClick={() => addSection()} aria-label="הוסף שורה">
          <Plus size={18} />
        </button>
      </div>
      {tab === 'widgets' && (
        <div className="p-3 flex-1 overflow-y-auto scrollbar-thin">
          <div className="relative mb-3">
            <input
              className="w-full h-9 rounded-md border px-9 text-sm"
              placeholder="חיפוש אלמנט"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">🔍</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {WIDGETS.filter((w) => w.label.includes(query)).map((w) => (
              <button
                key={w.type}
                className="card widget-tile overflow-hidden p-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 flex flex-col items-center justify-center gap-2"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-qs-widget', JSON.stringify({ type: w.type, payload: w.create() }))
                  e.dataTransfer.effectAllowed = 'copy'
                  // class for visual feedback
                  e.currentTarget.classList.add('dragging')
                  // custom subtle drag image to keep rounded border and add soft shadow
                  const clone = e.currentTarget.cloneNode(true) as HTMLElement
                  clone.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)'
                  clone.style.opacity = '1'
                  clone.style.position = 'absolute'
                  clone.style.top = '-1000px'
                  clone.style.left = '-1000px'
                  // שמור פריוויו זהה בדיוק למידות הכרטיס הנוכחי
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  clone.style.width = `${rect.width}px`
                  clone.style.height = `${rect.height}px`
                  clone.style.display = 'flex'
                  clone.style.backgroundColor = '#ffffff'
                  clone.style.alignItems = 'center'
                  clone.style.justifyContent = 'center'
                  clone.style.borderRadius = '8px'
                  document.body.appendChild(clone)
                  ;(e.currentTarget as any).__dragPreview = clone
                  e.dataTransfer.setDragImage(clone, clone.clientWidth / 2, clone.clientHeight / 2)
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove('dragging')
                  const prev = (e.currentTarget as any).__dragPreview as HTMLElement | undefined
                  if (prev && prev.parentNode) prev.parentNode.removeChild(prev)
                }}
                onClick={() => currentSectionId && addWidget(currentSectionId, w.create())}
              >
                <w.icon size={22} />
                <span className="text-xs">{w.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {tab === 'layers' && (
        <LayersPanel />
      )}
    </aside>
  )
}

function LayersPanel() {
  const page = useBuilderStore((s) => s.page)
  const select = useBuilderStore((s) => s.select)
  const removeWidget = useBuilderStore((s) => s.removeWidget)
  const moveWidget = useBuilderStore((s) => s.moveWidget)

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const [fromSectionId, widgetId] = String(active.id).split(':')
    const [toSectionId, , toIndexStr] = String(over.id).split(':')
    const toIndex = Number(toIndexStr)
    if (!widgetId || Number.isNaN(toIndex)) return
    if (fromSectionId && toSectionId) moveWidget(widgetId, toSectionId, toIndex)
  }

  return (
    <div className="p-2 flex-1 overflow-y-auto scrollbar-thin text-sm">
      <DndContext onDragEnd={onDragEnd}>
        {page.sections.map((section, si) => (
          <div key={section.id} className="mb-2">
            <button className="px-2 py-1 text-xs font-medium text-zinc-600 w-full text-right hover:bg-zinc-50 rounded" onClick={() => select({ kind: 'section', id: section.id })}>
              שורה {si + 1}
            </button>
            <SortableContext items={section.widgets.map((w, idx) => `${section.id}:${w.id}:${idx}`)} strategy={verticalListSortingStrategy}>
              <div className="ml-2 border rounded">
                {section.widgets.map((w, idx) => (
                  <LayerRow key={w.id} sectionId={section.id} index={idx} widget={w} onSelect={() => select({ kind: 'widget', id: w.id })} onDelete={() => removeWidget(w.id)} />
                ))}
                {section.widgets.length === 0 && (
                  <div className="px-2 py-2 text-xs text-zinc-500">אין פריטים</div>
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </DndContext>
    </div>
  )
}

function LayerRow({ widget, sectionId, index, onSelect, onDelete }: { widget: Widget; sectionId: string; index: number; onSelect: () => void; onDelete: () => void }) {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id: `${sectionId}:${widget.id}:${index}` })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center justify-between px-2 py-1 hover:bg-zinc-50">
      <div className="flex items-center gap-2">
        <button className="cursor-grab active:cursor-grabbing text-zinc-500" {...listeners} {...attributes} aria-label="גרירה"><GripVertical size={14} /></button>
        <button className="text-left" onClick={onSelect}>
          <span className="inline-flex items-center gap-1">
            {widget.type === 'image' ? <ImageIcon size={14} /> : widget.type === 'heading' || widget.type === 'text' ? <TypeIcon size={14} /> : <span className="w-3 inline-block" />}
            <span>{labelFor(widget.type)}</span>
          </span>
        </button>
      </div>
      <button className="text-zinc-500 hover:text-red-600" onClick={onDelete} aria-label="מחיקה"><Trash2 size={14} /></button>
    </div>
  )
}

function labelFor(type: Widget['type']) {
  switch (type) {
    case 'heading': return 'כותרת'
    case 'text': return 'טקסט'
    case 'button': return 'כפתור'
    case 'divider': return 'קו מפריד'
    case 'spacer': return 'ריווח'
    case 'image': return 'תמונה'
    case 'video': return 'וידאו'
    case 'gallery': return 'גלריה'
    case 'banner': return 'באנר'
    case 'marquee': return 'טקסט נע'
    case 'productSlider': return 'סליידר מוצרים'
    case 'html': return 'HTML'
    case 'container': return 'קונטיינר'
    default: return 'אלמנט'
  }
}

