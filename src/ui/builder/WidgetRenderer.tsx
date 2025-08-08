import type { Widget, StyleValues } from '@/types/builder'
import { useBuilderStore } from '@/store/useBuilderStore'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowRight, ArrowLeft, ShoppingCart } from 'lucide-react'
import { useMemo, useRef, useState, useEffect } from 'react'

function mergeStyles(base?: StyleValues, override?: StyleValues): StyleValues {
  return {
    ...(base ?? {}),
    ...(override ?? {}),
    margin: { ...(base?.margin ?? {}), ...(override?.margin ?? {}) },
    padding: { ...(base?.padding ?? {}), ...(override?.padding ?? {}) },
  }
}

function styleToCss(style?: StyleValues): React.CSSProperties {
  const margin = style?.margin
  const padding = style?.padding
  const shadow = style?.shadow
  return {
    background: style?.background,
    color: style?.color,
    borderRadius: style?.borderRadius,
    borderColor: style?.borderColor,
    borderWidth: style?.borderWidth,
    borderStyle: style?.borderStyle,
    width: style?.width,
    maxWidth: style?.maxWidth,
    minHeight: style?.minHeight as any,
    textAlign: style?.textAlign as any,
    fontSize: style?.fontSize,
    fontWeight: style?.fontWeight as any,
    lineHeight: style?.lineHeight,
    letterSpacing: style?.letterSpacing,
    zIndex: style?.zIndex,
    position: style?.position,
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
    boxShadow: shadow ? `${shadow.x ?? 0}px ${shadow.y ?? 0}px ${shadow.blur ?? 0}px ${shadow.spread ?? 0}px ${shadow.color ?? 'rgba(0,0,0,0.1)'}` : undefined,
  }
}

export function WidgetRenderer({ widget, sectionId, index, draggable = true }: { widget: Widget; sectionId: string; index: number; draggable?: boolean }) {
  const select = useBuilderStore((s) => s.select)
  const selected = useBuilderStore((s) => s.selected)
  const device = useBuilderStore((s) => s.device)
  const removeWidget = useBuilderStore((s) => s.removeWidget)
  const duplicateWidget = useBuilderStore((s) => s.duplicateWidget)
  const updateWidget = useBuilderStore((s) => s.updateWidget)

  const sortable = draggable ? useSortable({ id: `${sectionId}:${widget.id}:${index}` }) : ({} as any)
  const attributes = draggable ? sortable.attributes : {}
  const listeners = draggable ? sortable.listeners : {}
  const setNodeRef = draggable ? sortable.setNodeRef : undefined
  const transform = draggable ? sortable.transform : undefined
  const transition = draggable ? sortable.transition : undefined
  const [hovered, setHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string | undefined>(undefined)
  const [assetLoaded, setAssetLoaded] = useState<boolean>(false)
  const [assetProgress, setAssetProgress] = useState<number>(0)
  // אפס מצב טעינה כשמקור הנכס משתנה
  useEffect(() => {
    // אתחול טעינה כשנכס משתנה
    const key = widget.type === 'image'
      ? (widget as any).src
      : widget.type === 'banner'
        ? ((widget as any).backgroundVideoUrl || (widget as any).backgroundImage)
        : undefined
    if (!key) {
      setAssetLoaded(true)
      setAssetProgress(0)
      return
    }
    setAssetLoaded(false)
    setAssetProgress(1)
    // מדמה התקדמות עד ~90% כדי לתת חיווי גם ללא Content-Length
    let current = 1
    const interval = window.setInterval(() => {
      if (current < 90) {
        current += Math.max(1, Math.round((90 - current) * 0.08))
        setAssetProgress(current)
      }
    }, 200)
    return () => window.clearInterval(interval)
  }, [widget.type === 'image' ? (widget as any).src : undefined, widget.type === 'banner' ? (widget as any).backgroundImage : undefined, widget.type === 'banner' ? (widget as any).backgroundVideoUrl : undefined])

  if (!widget.visible) return null

  const isSelected = selected?.kind === 'widget' && selected.id === widget.id
  const isHidden = !!widget.advanced?.hiddenOn?.[device]

  const effectiveStyle = mergeStyles(
    widget.style,
    widget.responsiveStyle?.[device],
  )
  const hoverOverride = widget.type === 'button' ? (widget as Extract<Widget, { type: 'button' }>).hoverStyle : undefined
  const effectiveHoverStyle = mergeStyles(effectiveStyle, hovered ? hoverOverride : undefined)
  const anchorId = widget.advanced?.anchorId
  const iconEl = useMemo(() => {
    if (widget.type !== 'button') return null
    const btn = widget as Extract<Widget, { type: 'button' }>
    const icon = btn.icon ?? 'none'
    if (icon === 'arrow-right') return <ArrowRight size={16} />
    if (icon === 'arrow-left') return <ArrowLeft size={16} />
    if (icon === 'shopping-cart') return <ShoppingCart size={16} />
    return null
  }, [widget])

  // למנוע החלת טיפוגרפיה על מעטפת הווידג'ט כדי שלא תשפיע על פקדי העורך
  // וכן למנוע החלת borderRadius על המעטפת בתמונות/כפתורים; ניישם אותו על התוכן הרלוונטי בלבד
  const baseStyle = styleToCss(effectiveHoverStyle)
  const { color: _c, textAlign: _ta, fontSize: _fs, fontWeight: _fw, lineHeight: _lh, letterSpacing: _ls, fontFamily: _ff, ...nonTypographyStyle } = (baseStyle as any)
  const wrapperStyle: React.CSSProperties =
    widget.type === 'image'
      ? { ...nonTypographyStyle, borderRadius: undefined }
      : widget.type === 'button'
        ? { ...nonTypographyStyle, background: undefined, borderRadius: undefined }
        : { ...nonTypographyStyle }
  const contentTypographyStyle: React.CSSProperties = {
    color: effectiveHoverStyle.color,
    textAlign: effectiveHoverStyle.textAlign as any,
    fontSize: effectiveHoverStyle.fontSize,
    fontWeight: effectiveHoverStyle.fontWeight as any,
    lineHeight: effectiveHoverStyle.lineHeight,
    letterSpacing: effectiveHoverStyle.letterSpacing,
    fontFamily: (effectiveHoverStyle as any).fontFamily as any,
  }

  return (
    <div
      ref={setNodeRef as any}
      {...(attributes as any)}
      className={`relative ${draggable ? 'group group/widget' : ''} rounded ${widget.type === 'banner' ? 'p-0' : 'p-3'} ${draggable ? 'border ' + ((hovered || isSelected) ? 'border-zinc-200' : 'border-transparent') : ''} ${isSelected && draggable ? 'ring-1 ring-[var(--qs-outline-strong)]' : ''}`}
      style={{ ...wrapperStyle, transform: CSS.Transform.toString(transform), transition }}
      data-qs-index={index}
      data-qs-section={sectionId}
      onClick={(e) => {
        e.stopPropagation()
        if (!isEditing) select({ kind: 'widget', id: widget.id })
      }}
      onMouseEnter={() => draggable && setHovered(true)}
      onMouseLeave={() => draggable && setHovered(false)}
      id={anchorId}
    >
      {/* CSS מותאם אישית מוחל בתוך מיכל מבודד כדי שלא ישפיע על פקדי העורך */}
      <style>{`:where(.qs-widget-${widget.id}) { ${widget.advanced?.customCss ?? ''} }`}</style>
      {isHidden && (
        <div className="absolute inset-0 rounded pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 10px, transparent 10px, transparent 20px)'
          }}
        />
      )}
      {draggable && (
        <div className="absolute -top-2 right-2 text-[10px] text-white bg-black/80 px-1 rounded opacity-0 group-hover/widget:opacity-100 transition z-50">
        {(() => {
          switch (widget.type) {
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
        })()}
      </div>
      )}
      {draggable && (
      <div className="e-pill">
        <button title="מחק" onClick={() => removeWidget(widget.id)} aria-label="מחיקה">✕</button>
        <button title="גרור" className="cursor-grab active:cursor-grabbing" aria-label="גרירה" {...listeners}>⋮⋮</button>
        <button title="שכפל" onClick={() => duplicateWidget(widget.id)} aria-label="שכפול">⧉</button>
      </div>
      )}
      {widget.type === 'heading' && (
        (() => {
          const w = widget as Extract<Widget, { type: 'heading' }>
          const Tag = (w.tag || 'h2') as keyof JSX.IntrinsicElements
          if (isEditing && isSelected) {
            return (
              <div
                contentEditable
                suppressContentEditableWarning
                className="outline-none border border-zinc-300 rounded px-1"
                onInput={(e) => {
                  const value = (e.currentTarget as HTMLDivElement).innerText
                  setEditValue(value)
                  updateWidget(widget.id, (w) => { if (w.type === 'heading') w.content = value })
                }}
                onBlur={(e) => { setIsEditing(false); setEditValue(undefined) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLDivElement).blur() }
                }}
                onClick={(e) => e.stopPropagation()}
              >{editValue ?? w.content}</div>
            )
          }
          const content = (
            <Tag className="font-bold" style={{ margin: 0, ...contentTypographyStyle }} onDoubleClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditValue(w.content); setIsEditing(true) }}>{w.content}</Tag>
          )
          return w.href ? (
            <a href={w.href}>{content}</a>
          ) : content
        })()
      )}
      {widget.type === 'text' && (
        (() => { const w = widget as Extract<Widget, { type: 'text' }>; return isEditing && isSelected ? (
          <div
            contentEditable
            suppressContentEditableWarning
            className="outline-none border border-zinc-300 rounded px-1 leading-7"
            onInput={(e) => {
              const value = (e.currentTarget as HTMLDivElement).innerText
              setEditValue(value)
              updateWidget(widget.id, (w) => { if (w.type === 'text') w.content = value })
            }}
            onBlur={() => { setIsEditing(false); setEditValue(undefined) }}
            onClick={(e) => e.stopPropagation()}
          >{editValue ?? w.content}</div>
        ) : (
          <p className="leading-7" style={{ margin: 0, ...contentTypographyStyle }} onDoubleClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditValue(w.content); setIsEditing(true) }}>{w.content}</p>
        ) })()
      )}
      {widget.type === 'button' && (
        (() => { const w = widget as Extract<Widget, { type: 'button' }>; return <a
          href={w.href ?? '#'}
          className={`inline-flex items-center gap-2 justify-center rounded`}
          style={styleToCss(effectiveHoverStyle)}
        >
          {iconEl}
          <span>{w.label}</span>
        </a> })()
      )}
      {widget.type === 'divider' && <hr className="border-t border-zinc-200" />}
      {widget.type === 'spacer' && (() => { const w = widget as Extract<Widget, { type: 'spacer' }>; return <div style={{ height: (typeof w.height === 'number' ? w.height : String(w.height)) }} /> })()}
      {widget.type === 'image' && (
        (() => { const w = widget as Extract<Widget, { type: 'image' }>; return <figure className="overflow-hidden relative" style={{ borderRadius: effectiveHoverStyle.borderRadius as any }}>
          {!assetLoaded && (
            <div className="qs-skeleton">
              <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-white/70 rounded px-2 py-1 text-[11px] text-zinc-800 font-medium shadow">
                מוריד תמונה מהאינטרנט… {Math.max(1, Math.min(99, Math.round(assetProgress)))}%
              </div>
            </div>
          )}
          <a href={w.linkHref ?? undefined}>
            <img
              src={w.src}
              alt={w.alt ?? ''}
              loading={w.lazy ? 'lazy' : undefined}
              className="w-full h-auto block"
              style={{ objectFit: w.objectFit ?? 'cover', borderRadius: effectiveHoverStyle.borderRadius as any, opacity: assetLoaded ? 1 : 0, transition: 'opacity 200ms' }}
              onLoad={() => { setAssetLoaded(true); setAssetProgress(100) }}
              onError={() => { setAssetLoaded(true); setAssetProgress(100) }}
            />
          </a>
          {w.caption && <figcaption className="mt-1 text-xs text-zinc-500">{w.caption}</figcaption>}
        </figure> })()
      )}
      {widget.type === 'video' && (
        (() => { const w = widget as Extract<Widget, { type: 'video' }>; return <video
          src={w.src}
          autoPlay={w.autoplay}
          loop={w.loop}
          muted={w.muted}
          controls={w.controls}
          className="w-full h-auto"
        /> })()
      )}
      {widget.type === 'gallery' && (
        (() => {
          const w = widget as Extract<Widget, { type: 'gallery' }>
          const imgs = (w.images ?? []) as Array<{ id: string; src: string; alt?: string; caption?: string; linkHref?: string }>
          return <div className="grid" style={{ gridTemplateColumns: `repeat(${w.columns ?? 3}, minmax(0, 1fr))`, gap: w.gap ?? 12 }}>
          {imgs.length === 0 && <div className="text-sm text-zinc-500">אין תמונות בגלריה</div>}
          {imgs.map((img) => (
            <figure key={img.id}>
              <a href={img.linkHref ?? undefined}>
                <img src={img.src} alt={img.alt ?? ''} className="w-full h-auto rounded" />
              </a>
              {img.caption && <figcaption className="mt-1 text-xs text-zinc-500">{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
        })()
      )}
      {widget.type === 'container' && (
        <div className="w-full">
          {widget.columns && widget.columnsChildren ? (
            (() => {
              const cont = widget as Extract<Widget, { type: 'container' }>
              const [colOver, setColOver] = useState<number | null>(null)
              const [afterIndex, setAfterIndex] = useState<number>(-1)
              return (
                <div className="grid" style={{ gridTemplateColumns: `repeat(${cont.columns}, minmax(0, 1fr))`, gap: cont.flex?.gap ?? 16 }}>
                  {Array.from({ length: cont.columns as number }).map((_, colIdx) => (
                    <div
                      key={colIdx}
                      className={`min-h-[40px] rounded ${draggable ? 'border border-dashed p-1' : ''} ${draggable && colOver === colIdx ? 'border-[var(--qs-outline-strong)]' : ''}`}
                      onDragOver={!draggable ? undefined : (e) => {
                        if (e.dataTransfer.types.includes('application/x-qs-widget')) {
                          e.preventDefault();
                          e.stopPropagation();
                          setColOver(colIdx)
                          // חשב אינדקס יעד לפי מיקום העכבר
                          const container = e.currentTarget as HTMLDivElement
                          const items = Array.from(container.querySelectorAll('[data-qs-index]')) as HTMLElement[]
                          let idx = -1
                          for (let i = 0; i < items.length; i++) {
                            const rect = items[i].getBoundingClientRect()
                            const mid = rect.top + rect.height / 2
                            if (e.clientY > mid) idx = i
                          }
                          setAfterIndex(idx)
                        }
                      }}
                      onDragLeave={!draggable ? undefined : (e) => {
                        e.stopPropagation();
                        setColOver((prev) => (prev === colIdx ? null : prev))
                        setAfterIndex(-1)
                      }}
                      onDrop={!draggable ? undefined : (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const data = e.dataTransfer.getData('application/x-qs-widget')
                        if (!data) return
                        try {
                          const parsed = JSON.parse(data) as { type: string; payload: any }
                          useBuilderStore.getState().addChildWidgetAt(widget.id, parsed.payload, colIdx, afterIndex + 1)
                        } catch {}
                        setColOver(null)
                        setAfterIndex(-1)
                      }}
                    >
                      {(cont.columnsChildren?.[colIdx] ?? []).map((child, i) => (
                        <div key={child.id} className="relative">
                          {/* קו למעלה - לפני הווידג'ט הראשון כשgרוררים למעלה */}
                          {draggable && colOver === colIdx && afterIndex === -1 && i === 0 && (
                            <div className="h-1 bg-[var(--qs-outline-strong)] rounded mb-1" />
                          )}
                          {/* קו בין ווידג'טים - רק אם לא בתחילת הרשימה */}
                          {draggable && colOver === colIdx && afterIndex === i - 1 && i > 0 && (
                            <div className="h-1 bg-[var(--qs-outline-strong)] rounded my-1" />
                          )}
                          <WidgetRenderer widget={child} sectionId={sectionId} index={i} draggable={draggable} />
                          {draggable && colOver === colIdx && i === (cont.columnsChildren?.[colIdx]?.length ?? 0) - 1 && afterIndex === i && (
                            <div className="h-1 bg-[var(--qs-outline-strong)] rounded my-1" />
                          )}
                        </div>
                      ))}
                      {/* קו בעמודה ריקה */}
                      {draggable && (cont.columnsChildren?.[colIdx] ?? []).length === 0 && colOver === colIdx && (
                        <div className="h-1 bg-[var(--qs-outline-strong)] rounded my-1" />
                      )}
                      {(cont.columnsChildren?.[colIdx] ?? []).length === 0 && draggable && <div className="text-xs text-zinc-400 text-center py-2">גררו לכאן</div>}
                    </div>
                  ))}
                </div>
              )
            })()
          ) : (
            <div className="text-xs text-zinc-500">קונטיינר</div>
          )}
        </div>
      )}
      {widget.type === 'banner' && (
        <div className="rounded overflow-hidden relative">
          {(() => { const b = widget as Extract<Widget, { type: 'banner' }>; return (
            <>
              {!assetLoaded && (
                <div className="qs-skeleton">
                  <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-white/70 rounded px-2 py-1 text-[11px] text-zinc-800 font-medium shadow">
                    מוריד תמונה מהאינטרנט… {Math.max(1, Math.min(99, Math.round(assetProgress)))}%
                  </div>
                </div>
              )}
              {b.backgroundVideoUrl ? (
                <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline src={b.backgroundVideoUrl} onLoadedData={() => { setAssetLoaded(true); setAssetProgress(100) }} onError={() => { setAssetLoaded(true); setAssetProgress(100) }} />
              ) : (
                b.backgroundImage ? (
                  <img className="absolute inset-0 w-full h-full object-cover" src={b.backgroundImage} alt="" onLoad={() => { setAssetLoaded(true); setAssetProgress(100) }} onError={() => { setAssetLoaded(true); setAssetProgress(100) }} style={{ opacity: assetLoaded ? 1 : 0, transition: 'opacity 200ms' }} />
                ) : null
              )}
            </>
          ) })()}
          {(() => { const b = widget as Extract<Widget, { type: 'banner' }>; return b.overlayColor && (
            <div className="absolute inset-0" style={{ background: b.overlayColor }} />
          ) })()}
          {(() => {
            const b = widget as Extract<Widget, { type: 'banner' }>
            const pos = b.contentPosition ?? { horizontal: 'center', vertical: 'center' }
            const justify = pos.vertical === 'start' ? 'justify-start' : pos.vertical === 'end' ? 'justify-end' : 'justify-center'
            const align = pos.horizontal === 'start' ? 'items-start text-left' : pos.horizontal === 'end' ? 'items-end text-right' : 'items-center text-center'
            const isRTL = typeof document !== 'undefined' && (document.dir === 'rtl' || document.documentElement.dir === 'rtl')
            const ctaJustify = pos.horizontal === 'start'
              ? (isRTL ? 'justify-end' : 'justify-start')
              : pos.horizontal === 'end'
                ? (isRTL ? 'justify-start' : 'justify-end')
                : 'justify-center'
            // padding דינמי: בדסקטופ הקצה הוא 0 בצד היישור; במובייל שמירה על 10px מהקצה
            const isMobile = useBuilderStore.getState().device === 'mobile'
            const baseSidePadding = 24 // px-6
            const edgePadding = isMobile ? 10 : 0
            // קבע צד "התחלה" ו"סוף" ביחס ל-RTL
            const startProp = isRTL ? 'paddingRight' : 'paddingLeft'
            const endProp = isRTL ? 'paddingLeft' : 'paddingRight'
            const sidePadding: React.CSSProperties = (() => {
              if (pos.horizontal === 'start') {
                return { [startProp]: edgePadding, [endProp]: baseSidePadding } as any
              }
              if (pos.horizontal === 'end') {
                return { [endProp]: edgePadding, [startProp]: baseSidePadding } as any
              }
              return { paddingLeft: baseSidePadding, paddingRight: baseSidePadding }
            })()
            return (
              <div className={`relative flex flex-col gap-2 ${justify} ${align}`} style={{ minHeight: (effectiveHoverStyle.minHeight as any) ?? 240, padding: 0 }}>
                <div className={`${pos.horizontal === 'center' ? 'max-w-[720px]' : ''} w-full py-3`} style={{ paddingLeft: baseSidePadding, paddingRight: baseSidePadding, ...sidePadding }}>
                  {b.heading && <div className="mb-2" style={styleToCss(b.headingStyle)} dangerouslySetInnerHTML={{ __html: b.heading as string }} />}
                  {b.text && <div className="mb-3" style={styleToCss(b.textStyle)} dangerouslySetInnerHTML={{ __html: b.text as string }} />}
                  {b.ctaLabel && (
                    <div className={`flex flex-wrap gap-2 ${ctaJustify}`}>
                      <a href={b.ctaHref ?? '#'} className="inline-flex px-4 py-2 rounded" style={styleToCss(b.buttonStyle)}>
                        {b.ctaLabel}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}
      {widget.type === 'marquee' && (
        <div className="overflow-hidden whitespace-nowrap">
          <div
            className="inline-block animate-[marquee_linear_infinite]"
            style={{ animationDuration: `${Math.max(10, (widget as Extract<Widget, { type: 'marquee' }>).speed ?? 40)}s` }}
          >
            {(widget as Extract<Widget, { type: 'marquee' }>).text} • {(widget as Extract<Widget, { type: 'marquee' }>).text} • {(widget as Extract<Widget, { type: 'marquee' }>).text} • {(widget as Extract<Widget, { type: 'marquee' }>).text}
          </div>
        </div>
      )}
      {widget.type === 'productSlider' && (
        <ProductSliderView widget={widget as Extract<Widget, { type: 'productSlider' }>} device={device} />
      )}
      {widget.type === 'html' && (
        <div dangerouslySetInnerHTML={{ __html: ((widget as Extract<Widget, { type: 'html' }>).html as string) }} />
      )}
    </div>
  )
}

function ProductSliderView({ widget, device }: { widget: Extract<Widget, { type: 'productSlider' }>; device: 'desktop' | 'tablet' | 'mobile' }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const slides = (widget.productIds && widget.productIds.length ? widget.productIds : ['1', '2', '3', '4', '5']) as string[]
  const perView = widget.slidesPerView?.[device] ?? 4
  const pageCount = Math.max(1, Math.ceil(slides.length / perView))
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!widget.autoplay) return
    const id = setInterval(() => {
      setPage((p) => (p + 1) % pageCount)
    }, 3000)
    return () => clearInterval(id)
  }, [widget.autoplay, pageCount])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const width = el.clientWidth
    el.scrollTo({ left: page * width, behavior: 'smooth' })
  }, [page])

  return (
    <div>
      <div className="font-semibold mb-2">{widget.title ?? 'סליידר מוצרים'}</div>
      <div className="relative">
        <div className="overflow-x-auto scroll-smooth snap-x snap-mandatory" ref={containerRef}>
          <div className="flex" style={{ width: `${(slides.length / perView) * 100}%` }}>
            {slides.map((id, idx) => (
              <div key={id} className="shrink-0 snap-start px-2" style={{ width: `${100 / perView}%` }}>
                <div className="border rounded p-3">
                  <div className="aspect-video bg-zinc-100 rounded mb-2" />
                  <div className="text-sm">מוצר #{id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {widget.arrows && (
          <>
            <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded px-2 py-1" onClick={() => setPage((p) => Math.max(0, p - 1))}>
              ‹
            </button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded px-2 py-1" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
              ›
            </button>
          </>
        )}
      </div>
      {widget.dots && (
        <div className="flex gap-1 justify-center mt-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button key={i} className={`w-2 h-2 rounded-full ${i === page ? 'bg-zinc-900' : 'bg-zinc-300'}`} onClick={() => setPage(i)} />
          ))}
        </div>
      )}
    </div>
  )
}

