import { useBuilderStore } from '@/store/useBuilderStore'
import { WidgetRenderer } from './WidgetRenderer'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMemo, useState } from 'react'
import { MousePointerSquareDashed } from 'lucide-react'
import type { StyleValues } from '@/types/builder'

export function Canvas() {
  const page = useBuilderStore((s) => s.page)
  const select = useBuilderStore((s) => s.select)
  const moveWidget = useBuilderStore((s) => s.moveWidget)
  const addWidgetAt = useBuilderStore((s) => s.addWidgetAt)
  const addWidget = useBuilderStore((s) => s.addWidget)
  const addSection = useBuilderStore((s) => s.addSection)
  const selected = useBuilderStore((s) => s.selected)
  const device = useBuilderStore((s) => s.device)
  const zoom = useBuilderStore((s) => s.zoom)

  const [dragIndicator, setDragIndicator] = useState<{ sectionId: string; afterIndex: number } | null>(null)

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDragIndicator(null)
    if (!over) return
    const [fromSectionId, widgetId] = String(active.id).split(':')
    const [toSectionId, , toIndexStr] = String(over.id).split(':')
    let toIndex = Number(toIndexStr)
    if (!widgetId || Number.isNaN(toIndex)) return
    if (fromSectionId && toSectionId) {
      moveWidget(widgetId, toSectionId, toIndex)
    }
  }

  function mergeStyles(base?: StyleValues, override?: StyleValues): StyleValues {
    return {
      ...base,
      ...override,
      margin: { ...(base?.margin ?? {}), ...(override?.margin ?? {}) },
      padding: { ...(base?.padding ?? {}), ...(override?.padding ?? {}) },
    }
  }

  function styleToCss(style?: StyleValues): React.CSSProperties {
    const margin = style?.margin
    const padding = style?.padding
    return {
      background: style?.background,
      color: style?.color,
      borderRadius: style?.borderRadius,
      borderColor: style?.borderColor,
      borderWidth: style?.borderWidth,
      width: style?.width,
      maxWidth: style?.maxWidth,
      minHeight: style?.minHeight as any,
      textAlign: style?.textAlign as any,
      fontSize: style?.fontSize,
      fontWeight: style?.fontWeight as any,
      position: style?.position,
      zIndex: style?.zIndex,
      top: style?.top,
      right: style?.right,
      bottom: style?.bottom,
      left: style?.left,
      marginTop: margin?.top,
      marginBottom: margin?.bottom,
      marginLeft: margin?.left,
      marginRight: margin?.right,
      paddingTop: padding?.top,
      paddingBottom: padding?.bottom,
      paddingLeft: padding?.left,
      paddingRight: padding?.right,
    }
  }

  function flexToCss(section: (typeof page.sections)[number]) {
    const f = section.flex
    const style: React.CSSProperties = {
      display: 'flex',
      flexDirection: f?.direction ?? 'column',
      justifyContent:
        f?.justify === 'center' ? 'center' :
        f?.justify === 'end' ? 'flex-end' :
        f?.justify === 'between' ? 'space-between' :
        f?.justify === 'around' ? 'space-around' :
        f?.justify === 'evenly' ? 'space-evenly' : 'flex-start',
      alignItems:
        f?.align === 'center' ? 'center' :
        f?.align === 'end' ? 'flex-end' :
        f?.align === 'start' ? 'flex-start' : 'stretch',
      flexWrap: f?.wrap ?? 'nowrap',
      gap: (f?.gap ?? 16) + 'px',
    }
    return style
  }

  return (
    <main className={`h-full overflow-auto p-6 ${device === 'mobile' ? 'bg-zinc-100' : 'bg-white'}`}>
      {(() => {
        const previewWidth = device === 'desktop' ? 1140 : device === 'tablet' ? 820 : 390
        return (
          <div className="mx-auto bg-white border rounded shadow-sm" style={{ width: '100%', transition: 'width 150ms cubic-bezier(0.2, 0.7, 0.2, 1)' }}>

        {page.sections.length === 0 ? (
          <div
            className="m-6 min-h-[120px] border border-dashed border-zinc-300 rounded flex flex-col items-center justify-center gap-2 text-sm text-zinc-500"
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes('application/x-qs-widget')) e.preventDefault()
            }}
            onDrop={(e) => {
              const data = e.dataTransfer.getData('application/x-qs-widget')
              if (!data) return
              try {
                const parsed = JSON.parse(data) as { type: string; payload: any }
                addSection()
                const sections = useBuilderStore.getState().page.sections
                const newSectionId = sections[sections.length - 1]?.id
                if (newSectionId) addWidget(newSectionId, parsed.payload)
              } catch {}
            }}
          >
            <MousePointerSquareDashed size={22} />
            <div>גררו ווידג'טים לכאן או הוסיפו מהצד</div>
          </div>
        ) : (
        <DndContext onDragEnd={onDragEnd}>
          {page.sections.map((section) => (
            (section.advanced?.hiddenOn?.[device] ? null : (
            <section
              key={section.id}
              className={`card group relative border border-transparent group-hover:border-zinc-200 ${section.widgets.length === 0 ? 'border-0' : ''} ${selected?.kind === 'section' && selected.id === section.id ? 'ring-1 ring-[var(--qs-outline-strong)]' : ''}`}
              style={{ ...styleToCss(mergeStyles(section.style, section.responsiveStyle?.[device])), marginLeft: 'auto', marginRight: 'auto' }}
              id={section.advanced?.anchorId}
          onClick={() => select({ kind: 'section', id: section.id })}
            >
              <style>{section.advanced?.customCss ?? ''}</style>
              <div className="absolute top-1 left-1 z-20 text-xs text-zinc-500 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition pointer-events-auto">
                <span className="chip cursor-pointer select-none" onClick={(e) => { e.stopPropagation(); select({ kind: 'section', id: section.id }) }}>שורה</span>
                {/* ניתן לחבר למחיקה/שכפול מקטע בהמשך */}
              </div>
              <div className="e-pill hoverable section-pill" style={{ top: -18 }}>
                <button className="ghost" title="שכפל" onClick={(e) => { e.stopPropagation(); useBuilderStore.getState().duplicateSection(section.id) }}>⧉</button>
                <button title="גרור" className="cursor-grab active:cursor-grabbing" onMouseDown={(e) => e.stopPropagation()}>⋮⋮</button>
                <button title="מחק" onClick={(e) => { e.stopPropagation(); useBuilderStore.getState().removeSection(section.id) }}>✕</button>
              </div>
              <SortableContext
                items={section.widgets.map((w, idx) => `${section.id}:${w.id}:${idx}`)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  style={flexToCss(section)}
                  className={`${section.widgets.length === 0 ? 'min-h-[80px] border border-dashed border-zinc-300' : 'border border-transparent'} rounded transition ${section.widgets.length === 0 ? '' : 'group-hover:border-[var(--qs-outline-strong)] group-hover:border-dashed'}`}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes('application/x-qs-widget')) {
                      e.preventDefault()
                      const children = Array.from(e.currentTarget.querySelectorAll('[data-qs-index]')) as HTMLElement[]
                      let afterIndex = -1
                      for (let i = 0; i < children.length; i++) {
                        const rect = children[i].getBoundingClientRect()
                        const third = rect.top + rect.height / 3
                        const twoThird = rect.top + (2 * rect.height) / 3
                        // מגנטיות: אם העכבר בשליש העליון → לפני הפריט; אם בשליש התחתון → אחרי הפריט
                        if (e.clientY > twoThird) afterIndex = i
                        else if (e.clientY > third) { afterIndex = i - 1; break }
                        else { afterIndex = i - 1; break }
                      }
                      setDragIndicator({ sectionId: section.id, afterIndex })
                    }
                  }}
                  onDrop={(e) => {
                    const data = e.dataTransfer.getData('application/x-qs-widget')
                    if (!data) return
                    try {
                      const parsed = JSON.parse(data) as { type: string; payload: any }
                      const idx = dragIndicator && dragIndicator.sectionId === section.id ? dragIndicator.afterIndex + 1 : section.widgets.length
                      addWidgetAt(section.id, parsed.payload, idx)
                    } catch {}
                    setDragIndicator(null)
                  }}
                  onDragLeave={() => setDragIndicator(null)}
                >
                  {section.widgets.length === 0 && (
                    <div className="py-6 text-sm text-zinc-500 flex flex-col items-center justify-center gap-2">
                      <MousePointerSquareDashed size={22} />
                      <div>גררו ווידג'טים לכאן או הוסיפו מהצד</div>
                    </div>
                  )}
                  {section.widgets.map((w, idx) => (
                    <div key={w.id} className="relative">
                      {dragIndicator && dragIndicator.sectionId === section.id && dragIndicator.afterIndex === idx - 1 && idx !== 0 && (
                        <div className="h-1.5 bg-[var(--qs-outline-strong)] rounded my-1" />
                      )}
                      {/* קו לפני הפריט הראשון */}
                      {dragIndicator && dragIndicator.sectionId === section.id && idx === 0 && dragIndicator.afterIndex === -1 && (
                        <div className="h-1.5 bg-[var(--qs-outline-strong)] rounded my-1" />
                      )}
                      <WidgetRenderer widget={w} sectionId={section.id} index={idx} />
                      {/* קו אחרי הפריט האחרון */}
                      {dragIndicator && dragIndicator.sectionId === section.id && idx === section.widgets.length - 1 && dragIndicator.afterIndex === idx && (
                        <div className="h-1.5 bg-[var(--qs-outline-strong)] rounded my-1" />
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </section>
            ))
          ))}
        </DndContext>
        )}
          </div>
        )
      })()}
    </main>
  )
}

