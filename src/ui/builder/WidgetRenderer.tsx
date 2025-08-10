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
    // אתחול טעינה כשנכס משתנה (לוקח בחשבון מובייל/דסקטופ)
    const currentDevice = useBuilderStore.getState().device
    const key = widget.type === 'image'
      ? ((currentDevice === 'mobile' && (widget as any).mobileSrc) || (widget as any).src)
      : widget.type === 'banner'
        ? ((currentDevice === 'mobile' && ((widget as any).backgroundVideoUrlMobile || (widget as any).backgroundImageMobile)) || (widget as any).backgroundVideoUrl || (widget as any).backgroundImage)
        : widget.type === 'video'
          ? ((currentDevice === 'mobile' && (widget as any).mobileSrc) || (widget as any).src)
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
  }, [
    widget.type === 'image' ? (widget as any).src : undefined,
    widget.type === 'image' ? (widget as any).mobileSrc : undefined,
    widget.type === 'video' ? (widget as any).src : undefined,
    widget.type === 'video' ? (widget as any).mobileSrc : undefined,
    widget.type === 'banner' ? (widget as any).backgroundImage : undefined,
    widget.type === 'banner' ? (widget as any).backgroundImageMobile : undefined,
    widget.type === 'banner' ? (widget as any).backgroundVideoUrl : undefined,
    widget.type === 'banner' ? (widget as any).backgroundVideoUrlMobile : undefined,
    useBuilderStore.getState().device,
  ])

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
      ? { ...nonTypographyStyle, borderRadius: undefined, borderColor: undefined, borderWidth: undefined, borderStyle: undefined }
      : widget.type === 'button'
        ? { ...nonTypographyStyle, background: undefined, borderRadius: undefined }
        : widget.type === 'divider'
          ? { ...nonTypographyStyle, borderColor: undefined, borderWidth: undefined, borderStyle: undefined }
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
      className={`relative group group/widget rounded ${widget.type === 'banner' ? 'p-0' : 'p-3'} ${draggable ? 'border ' + ((hovered || isSelected) ? 'border-zinc-200' : 'border-transparent') : ''} ${isSelected && draggable ? 'ring-1 ring-[var(--qs-outline-strong)]' : ''}`}
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
      <div className="e-pill" style={{ zIndex: 60 }}>
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
                dir="rtl"
                style={{ ...contentTypographyStyle, whiteSpace: 'pre-wrap', textAlign: 'right' }}
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
          <textarea
            className="outline-none border border-zinc-300 rounded px-2 py-1 leading-7 w-full"
            dir="rtl"
            style={{ ...contentTypographyStyle, whiteSpace: 'pre-wrap' as any, textAlign: undefined }}
            value={(editValue ?? w.content)?.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '')}
            onChange={(e) => {
              const value = e.currentTarget.value
              setEditValue(value)
              updateWidget(widget.id, (w) => { if (w.type === 'text') w.content = value.replace(/\n/g, '<br/>') })
            }}
            onBlur={() => { setIsEditing(false); setEditValue(undefined) }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="leading-7" style={{ margin: 0, ...contentTypographyStyle, whiteSpace: 'pre-wrap' }} onDoubleClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditValue(w.content); setIsEditing(true) }}>{(w.content ?? '').replace(/<br\s*\/?>/g, '\n')}</div>
        ) })()
      )}
      {widget.type === 'button' && (
        (() => {
          const w = widget as Extract<Widget, { type: 'button' }>
          const variant = w.variant ?? 'filled'
          // נבנה סגנון בסיס לפי וריאנט: מלא, מתאר, טקסט, קו תחתון
          const variantStyle: React.CSSProperties = (() => {
            const s = styleToCss(effectiveHoverStyle)
            const normalize = (c?: string) => (c ?? '').toLowerCase().replace(/\s+/g, '')
            const isWhite = (c?: string) => {
              const n = normalize(c)
              return n === '#fff' || n === '#ffffff' || n === 'white' || n === 'rgb(255,255,255)' || n === 'rgba(255,255,255,1)'
            }
            const computedTextColor = (w.variant ?? 'filled') === 'filled' ? (s.color as any) : (isWhite(s.color as any) || !s.color ? '#111111' : (s.color as any))
            const basePadding = {
              paddingTop: s.paddingTop ?? 8,
              paddingBottom: s.paddingBottom ?? 8,
              paddingLeft: s.paddingLeft ?? 12,
              paddingRight: s.paddingRight ?? 12,
            }
            const radius = { borderRadius: s.borderRadius }
            const width = s.width ? { width: s.width } : {}
            const textColor = { color: computedTextColor }
            const bg = s.background ? { background: s.background } : {}
            const border = {
              borderColor: s.borderColor ?? computedTextColor ?? '#111',
              borderWidth: s.borderWidth ?? 1,
              borderStyle: s.borderStyle ?? 'solid',
            } as React.CSSProperties
            if (variant === 'filled') {
              return { ...basePadding, ...radius, ...width, ...bg, ...textColor }
            }
            if (variant === 'outline') {
              return { ...basePadding, ...radius, ...width, background: 'transparent', ...textColor, ...border }
            }
            if (variant === 'underline') {
              return { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, ...width, background: 'transparent', ...textColor, textDecoration: 'underline' }
            }
            // text
            return { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, ...width, background: 'transparent', ...textColor }
          })()
          // מיפוי textAlign ל-justifyContent עבור פריסת flex של הכפתור
          const justify = ((): React.CSSProperties['justifyContent'] => {
            const ta = (effectiveHoverStyle.textAlign as any) || 'center'
            if (ta === 'left') return 'flex-start'
            if (ta === 'right') return 'flex-end'
            return 'center'
          })()
          return (
            <div style={{ textAlign: (effectiveHoverStyle.textAlign as any) || 'right' }}>
              <a
                href={w.href ?? '#'}
                className={`inline-flex items-center gap-2`}
                style={{ ...variantStyle, justifyContent: justify, display: 'inline-flex' }}
              >
                {iconEl}
                <span>{w.label}</span>
              </a>
            </div>
          )
        })()
      )}
      {widget.type === 'divider' && (() => {
        const s = effectiveHoverStyle
        return (
          <hr
            className="border-0 border-t"
            style={{
              borderColor: s.borderColor,
              borderTopWidth: (s.borderWidth as any) ?? 1,
              borderStyle: (s.borderStyle as any) ?? 'solid',
              marginTop: s.margin?.top as any,
              marginBottom: s.margin?.bottom as any,
            }}
          />
        )
      })()}
      {widget.type === 'spacer' && (() => { const w = widget as Extract<Widget, { type: 'spacer' }>; return <div style={{ height: (typeof w.height === 'number' ? w.height : String(w.height)) }} /> })()}
      {widget.type === 'image' && (
        (() => { const w = widget as Extract<Widget, { type: 'image' }>; const currentDevice = useBuilderStore.getState().device; const imgSrc = (currentDevice === 'mobile' && (w as any).mobileSrc) ? (w as any).mobileSrc : w.src; return <figure className="overflow-hidden relative" style={{ borderRadius: effectiveHoverStyle.borderRadius as any, minHeight: assetLoaded ? undefined : 180 }}>
          {!assetLoaded && (
            <div className="qs-skeleton">
              <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-white/70 rounded px-2 py-1 text-[11px] text-zinc-800 font-medium shadow">
                מוריד תמונה מהאינטרנט… {Math.max(1, Math.min(99, Math.round(assetProgress)))}%
              </div>
            </div>
          )}
          <a href={w.linkHref ?? undefined}>
            <img
              src={imgSrc}
              alt={w.alt ?? ''}
              loading={w.lazy ? 'lazy' : undefined}
              className="w-full block"
              style={{ height: (w as any).height ? (w as any).height : 'auto', objectFit: w.objectFit ?? 'cover', borderRadius: effectiveHoverStyle.borderRadius as any, opacity: assetLoaded ? 1 : 0, transition: 'opacity 200ms' }}
              onLoad={() => { setAssetLoaded(true); setAssetProgress(100) }}
              onError={() => { setAssetLoaded(true); setAssetProgress(100) }}
            />
          </a>
          {w.caption && <figcaption className="mt-1 text-xs text-zinc-500">{w.caption}</figcaption>}
        </figure> })()
      )}
      {widget.type === 'video' && (
        (() => { const w = widget as Extract<Widget, { type: 'video' }>; const currentDevice = useBuilderStore.getState().device; const videoSrc = (currentDevice === 'mobile' && (w as any).mobileSrc) ? (w as any).mobileSrc : w.src; return <video
          src={videoSrc}
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
          {Array.isArray(imgs) && imgs.length === 0 && <div className="text-sm text-zinc-500">אין תמונות בגלריה</div>}
          {Array.isArray(imgs) && imgs.map((img) => (
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
              const currentColumns = cont.responsiveColumns?.[device] || cont.columns
              return (
                <div className="grid" style={{ gridTemplateColumns: `repeat(${currentColumns}, minmax(0, 1fr))`, gap: cont.flex?.gap ?? 16 }}>
                  {Array.from({ length: (currentColumns as number) }).map((_, colIdx) => (
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
        <div className="overflow-hidden relative" style={{ borderRadius: (effectiveHoverStyle.borderRadius as any) }}>
          {(() => { const b = widget as Extract<Widget, { type: 'banner' }>; return (
            <>
              {!assetLoaded && (
                <div className="qs-skeleton">
                  <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-white/70 rounded px-2 py-1 text-[11px] text-zinc-800 font-medium shadow">
                    מוריד תמונה מהאינטרנט… {Math.max(1, Math.min(99, Math.round(assetProgress)))}%
                  </div>
                </div>
              )}
              {(() => {
                const currentDevice = useBuilderStore.getState().device
                const videoSrc = currentDevice === 'mobile' ? ((b as any).backgroundVideoUrlMobile || b.backgroundVideoUrl) : b.backgroundVideoUrl
                const imageSrc = currentDevice === 'mobile' ? ((b as any).backgroundImageMobile || b.backgroundImage) : b.backgroundImage
                if (videoSrc) {
                  return <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline src={videoSrc} onLoadedData={() => { setAssetLoaded(true); setAssetProgress(100) }} onError={() => { setAssetLoaded(true); setAssetProgress(100) }} />
                }
                if (imageSrc) {
                  return <img className="absolute inset-0 w-full h-full object-cover" src={imageSrc} alt="" onLoad={() => { setAssetLoaded(true); setAssetProgress(100) }} onError={() => { setAssetLoaded(true); setAssetProgress(100) }} style={{ opacity: assetLoaded ? 1 : 0, transition: 'opacity 200ms' }} />
                }
                return null
              })()}
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
      {widget.type === 'newsletter' && (
        (() => {
          const w = widget as Extract<Widget, { type: 'newsletter' }>
          const slug = (window as any).__PREVIEW_BOOTSTRAP__?.storeSlug || (window as any).STORE_DATA?.slug
          const [email, setEmail] = useState('')
          const [name, setName] = useState('')
          const [phone, setPhone] = useState('')
          const [consent, setConsent] = useState(true)
          const [loading, setLoading] = useState(false)
          const [done, setDone] = useState(false)
          const [error, setError] = useState<string | null>(null)
          const submit = async (e?: React.FormEvent) => {
            e?.preventDefault()
            setError(null)
            // ולידציה בסיסית
            const emailOk = /.+@.+\..+/.test(email)
            if (!emailOk) { setError('נא להזין אימייל תקין'); return }
            if (w.showPhone && phone && !/^\d{9,10}$/.test(phone)) { setError('נא להזין מספר טלפון תקין'); return }
            setLoading(true)
            try {
              if (slug) {
                const res = await fetch(`/api/stores/${slug}/newsletter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ first_name: name || undefined, email, phone: phone || undefined, marketing_consent: consent ? 1 : 0 }) })
                const data = await res.json()
                if (!res.ok || data?.success === false) throw new Error(data?.message || 'שגיאה')
              }
              setDone(true)
            } catch (err:any) {
              setError(err?.message || 'שגיאה בשליחה')
            } finally { setLoading(false) }
          }
          if (done) return <div className="p-4 rounded bg-zinc-50 text-center" style={contentTypographyStyle}>{w.successMessage || 'תודה! נרשמת בהצלחה.'}</div>
          return (
            <form className="space-y-3" onSubmit={submit} style={{ textAlign: (w.align || 'center') as any }}>
              {w.title && <div className="font-semibold text-lg" style={{ ...contentTypographyStyle }}>{w.title}</div>}
              {w.description && <div className="text-sm text-zinc-600" style={{ ...contentTypographyStyle }}>{w.description}</div>}
              <div className="inline-flex items-stretch gap-0" style={{ width: (w.inputWidth ?? '50%') as any, maxWidth: '100%' }}>
                <input type="email" className="h-11 border px-3 text-sm bg-white" style={{ flex: 1, minWidth: 0, borderTopLeftRadius: (document.dir === 'rtl' ? 0 : (w.inputRadius ?? 6)), borderBottomLeftRadius: (document.dir === 'rtl' ? 0 : (w.inputRadius ?? 6)), borderTopRightRadius: (document.dir === 'rtl' ? (w.inputRadius ?? 6) : 0), borderBottomRightRadius: (document.dir === 'rtl' ? (w.inputRadius ?? 6) : 0) }} placeholder={w.placeholder || 'כתובת דוא"ל'} value={email} onChange={(e)=>setEmail(e.target.value)} />
                <button type="submit" className="h-11 px-5 text-sm text-white" style={{ background: '#111', borderTopRightRadius: (document.dir === 'rtl' ? 0 : (w.buttonRadius ?? 6)), borderBottomRightRadius: (document.dir === 'rtl' ? 0 : (w.buttonRadius ?? 6)), borderTopLeftRadius: (document.dir === 'rtl' ? (w.buttonRadius ?? 6) : 0), borderBottomLeftRadius: (document.dir === 'rtl' ? (w.buttonRadius ?? 6) : 0) }} disabled={loading}>{loading ? 'נרשם…' : (w.buttonLabel || 'SEND')}</button>
              </div>
              {w.checkboxEnabled && (
                <label className="text-xs text-zinc-600 inline-flex items-center gap-3" style={{ display: 'block', marginTop: 8}}>
                  <input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} style={{ transform: 'translateY(1px)', marginLeft: 5 }} />
                  <span dangerouslySetInnerHTML={{ __html: w.checkboxLabelHtml || 'אני מאשר/ת קבלת דיוור' }} />
                </label>
              )}
              {error && <div className="text-xs text-red-600">{error}</div>}
            </form>
          )
        })()
      )}
    </div>
  )
}

function ProductSliderView({ widget, device }: { widget: Extract<Widget, { type: 'productSlider' }>; device: 'desktop' | 'tablet' | 'mobile' }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [items, setItems] = useState<any[] | null>(widget.products ?? null)
  const [wishlist, setWishlist] = useState<Set<string>>(() => new Set<string>())
  const slug = useBuilderStore.getState().storeSlug || (window as any).__BUILDER_BOOTSTRAP__?.storeSlug || (window as any).__PREVIEW_BOOTSTRAP__?.storeSlug || (window as any).STORE_DATA?.slug
  const useApi = !!slug && (!!(widget as any).categoryId || !!(Array.isArray(widget.categoryIds) && widget.categoryIds.length) || !!(Array.isArray(widget.productIds) && widget.productIds.length))
  // טעינת Wishlist התחלתית
  useEffect(() => {
    if (!slug) return
    fetch(`/api/stores/${slug}/wishlist`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then((data) => {
        const ids: any[] = (data?.items ?? data ?? []) as any[]
        if (Array.isArray(ids)) {
          setWishlist(new Set(ids.map((x: any) => String(x))))
        }
      })
      .catch(() => {})
  }, [slug])
  useEffect(() => {
    if (!useApi) return
    const limit = widget.limit ?? 12
    const qs: string[] = [`limit=${limit}`]
    const singleCat:any = (widget as any).categoryId
    if (singleCat) qs.push(`category_id=${singleCat}`)
    else if (Array.isArray(widget.categoryIds) && widget.categoryIds.length) qs.push(`category_id=${(widget.categoryIds as any).join(',')}`)
    // אופציונלי: אם ירצו ids ספציפיים
    if (Array.isArray(widget.productIds) && widget.productIds.length) qs.push(`ids=${widget.productIds.join(',')}`)
    const url = `/api/stores/${slug}/products?` + qs.join('&')
    setItems(null)
    fetch(url, { credentials: 'include' })
      .then(r => r.json())
      .then((res) => {
        const data = (res?.data ?? res) as any[]
        setItems(Array.isArray(data) ? data : [])
      })
      .catch(() => setItems([]))
  }, [slug, useApi, JSON.stringify(widget.categoryIds), JSON.stringify(widget.productIds), widget.limit])
  // בונה דמו מפורט אם אין נתונים מה-API
  function buildMockProducts(count: number): any[] {
    const palette = ['#111', '#2563eb', '#10b981', '#ef4444', '#7c3aed', '#f59e0b', '#0ea5e9']
    const sizeOptions = ['XS','S','M','L','XL']
    return Array.from({ length: count }).map((_, i) => {
      const id = `mock-${i+1}`
      const colorCodes = [palette[i % palette.length], palette[(i+2) % palette.length], palette[(i+4) % palette.length]]
      const variants = colorCodes.map((c, idx) => ({ id: `${id}-v${idx+1}`, sku: `${id}-sku${idx+1}`, regular_price: 129 + (idx*10), sale_price: idx % 2 === 0 ? 99 + (idx*10) : undefined, inventory_quantity: 10, options: { Color: `C${idx+1}` }, display_type: 'color', color_code: c }))
      return {
        id,
        name: `מוצר #${i+1}`,
        slug: `product-${i+1}`,
        type: 'variable',
        regular_price: 129,
        sale_price: 0,
        images: [`https://picsum.photos/seed/qs-${i+1}/800/1000`],
        variants,
        options: [
          { name: 'צבע', display_type: 'color', values: colorCodes.map(c => ({ color_code: c })) },
          { name: 'מידה', display_type: 'button', values: sizeOptions.map(v => ({ value: v })) },
        ],
        product_url: '#',
        badge_text: i % 3 === 0 ? 'SALE' : (i % 5 === 0 ? 'TOP' : undefined),
        badge_color: i % 3 === 0 ? '#ef4444' : (i % 5 === 0 ? '#111111' : undefined),
        is_new: i % 4 === 0,
      }
    })
  }

  const displayItems = (items && Array.isArray(items) && items.length
    ? items
    : buildMockProducts(Math.max(4, widget.limit ?? 8)))

  const slides = (displayItems && Array.isArray(displayItems) && displayItems.length
    ? displayItems.map((p:any) => String(p.id))
    : (widget.products && Array.isArray(widget.products) && widget.products.length
      ? widget.products.map((p) => p.id)
      : (widget.productIds && Array.isArray(widget.productIds) && widget.productIds.length ? widget.productIds : ['1', '2', '3', '4', '5']))) as string[]
  const basePerView = (() => {
    const raw = widget.slidesPerView?.[device]
    if (raw === undefined || raw === null) return device === 'desktop' ? 4 : device === 'tablet' ? 2 : 1
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : (device === 'desktop' ? 4 : device === 'tablet' ? 2 : 1)
  })()
  const peekExtra = device === 'mobile' ? 0.15 : 0 // מציגים “עוד קצת” במובייל
  const visibleCount = basePerView + peekExtra
  const cardBasisPercent = 100 / visibleCount
  const pageCount = Math.max(1, Math.ceil((Array.isArray(slides) ? slides.length : 0) / Math.ceil(basePerView)))
  const [page, setPage] = useState(0)
  // Drag-to-scroll (גם בדסקטופ)
  const [dragging, setDragging] = useState(false)
  const dragState = useRef<{ startX: number; startLeft: number }>({ startX: 0, startLeft: 0 })

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

  const ratio = (widget as any).imageRatio || '4/5'
  const card = (widget as any).cardOptions || {}
  // Wishlist toggle
  async function toggleWishlist(productId: string | number) {
    if (!slug) {
      // מצב ללא API – טוגל מקומי
      setWishlist(prev => {
        const s = new Set(prev); const id = String(productId); if (s.has(id)) s.delete(id); else s.add(id); return s
      })
      return
    }
    try {
      const res = await fetch(`/api/stores/${slug}/wishlist`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: productId }) })
      const data = await res.json()
      const itemsIds = (data?.items ?? []) as any[]
      setWishlist(new Set(itemsIds.map((x: any) => String(x))))
    } catch {}
  }
  // Quick add to cart (פשוט)
  async function quickAdd(item: any) {
    if (!slug) return
    try {
      const payload: any = { product_id: item.id, quantity: 1 }
      if (item.type === 'variable') {
        // אם יש וריאציה יחידה – נשלח אותה; אחרת נבקש מהמשתמש לבחור (פשטני)
        if (Array.isArray(item.variants) && item.variants.length === 1) {
          payload.variation_id = item.variants[0].id
        } else {
          alert('למוצר יש וריאציות – יש לבחור בדף המוצר')
          return
        }
      }
      await fetch(`/api/stores/${slug}/cart`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      // ניתן להוסיף Toast/רענון מונה עגלה כאן
    } catch {}
  }
  return (
    <div>
      <div className="font-semibold mb-2">{widget.title ?? 'סליידר מוצרים'}</div>
      <div className="relative">
        <div
          className="overflow-x-auto scroll-smooth snap-x snap-proximity"
          ref={containerRef}
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' as any, cursor: dragging ? 'grabbing' : 'grab' }}
          onMouseDown={(e)=>{
            const el = containerRef.current; if (!el) return
            setDragging(true)
            dragState.current = { startX: e.pageX, startLeft: el.scrollLeft }
          }}
          onMouseMove={(e)=>{
            if (!dragging) return
            const el = containerRef.current; if (!el) return
            const dx = e.pageX - dragState.current.startX
            el.scrollLeft = dragState.current.startLeft - dx
          }}
          onMouseUp={()=> setDragging(false)}
          onMouseLeave={()=> setDragging(false)}
        >
          <div className="flex flex-nowrap -mx-2 px-2">
            {slides.map((id, idx) => {
              const mock = (widget.products ?? []).find((p) => String(p.id) === String(id))
              const apiItem = (displayItems ?? []).find((p:any) => String(p.id) === String(id))
              const title = apiItem?.name ?? mock?.title ?? `מוצר #${id}`
              const href = apiItem?.product_url ?? mock?.href ?? '#'
              const image = (apiItem?.images?.[0]) ?? mock?.image ?? `https://picsum.photos/seed/${id}/800/800`
              // מחיר: חישוב מינימום לפי וריאציות או שדות מוצר
              const priceMeta = (() => {
                const p:any = apiItem
                if (!p) return { reg: mock?.price, sale: undefined }
                if (p.type === 'variable' && Array.isArray(p.variants) && p.variants.length) {
                  const regMin = Math.min(...p.variants.map((v:any) => Number(v.regular_price ?? Infinity)))
                  const saleMin = Math.min(...p.variants.map((v:any) => Number(v.sale_price ?? Infinity)))
                  return {
                    reg: Number.isFinite(regMin) ? regMin : undefined,
                    sale: Number.isFinite(saleMin) ? saleMin : undefined,
                  }
                }
                return { reg: Number(p.regular_price ?? NaN), sale: Number.isFinite(Number(p.sale_price)) ? Number(p.sale_price) : undefined }
              })()
              const isSale = (priceMeta.sale ?? Infinity) < (priceMeta.reg ?? Infinity)
              // סוואצ'ים: לפי options.display_type==='color' או לפי variants[].color_code
              const allColors: string[] = (() => {
                const p:any = apiItem
                const set = new Set<string>()
                if (p?.options) {
                  const colorOpt = (p.options as any[]).find(o => (o.display_type === 'color'))
                  colorOpt?.values?.forEach((v:any) => { if (v?.color_code) set.add(v.color_code) })
                }
                if (p?.variants) {
                  (p.variants as any[]).forEach(v => { if (v?.color_code) set.add(v.color_code) })
                }
                return Array.from(set).slice(0, 6)
              })()
              const maxShowColors = 5
              const colorSwatches = allColors.slice(0, maxShowColors)
              const moreColors = (Array.isArray(allColors) ? allColors.length : 0) - (Array.isArray(colorSwatches) ? colorSwatches.length : 0)
              // אופציות טקסטואליות (למשל מידות)
              const textOptions: string[] = (() => {
                const p:any = apiItem
                const res:string[] = []
                if (p?.options) {
                  (p.options as any[]).forEach(o => {
                    if (o?.display_type === 'button') {
                      (o.values ?? []).slice(0,6).forEach((v:any) => res.push(String(v?.value ?? v?.name ?? '')))
                    }
                  })
                }
                return res.slice(0, 8)
              })()
              const isRTL = typeof document !== 'undefined' && (document.dir === 'rtl' || document.documentElement.dir === 'rtl')
              const justifyCss = (align: 'left' | 'center' | 'right' | undefined) => {
                if (align === 'center') return 'center'
                if (align === 'left') return isRTL ? 'flex-end' : 'flex-start'
                return isRTL ? 'flex-start' : 'flex-end'
              }
              return (
                <div key={id} className="shrink-0 snap-start px-2" style={{ flex: `0 0 ${cardBasisPercent}%`, minWidth: `${cardBasisPercent}%` }}>
                  {(() => { const cardBorder = (card.showCardBorder === true) ? 'border' : ''; return (
                  <a href={href} className={`block ${cardBorder} rounded overflow-hidden`}>
                    <div className="relative bg-zinc-100 overflow-hidden" style={{ aspectRatio: ratio.replace('/', ' / ') }}>
                      {image ? <img src={image} loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-200 animate-pulse" />}
                      {/* באדג'ים */}
                      {card.showBadges !== false && isSale && <span className="absolute top-2 right-2 text-[10px] font-bold bg-red-500 text-white rounded px-2 py-0.5">SALE</span>}
                      {card.showBadges !== false && !!apiItem?.badge_text && <span className="absolute top-2 left-2 text-[10px] font-bold text-white rounded px-2 py-0.5" style={{ background: apiItem?.badge_color || '#111' }}>{apiItem.badge_text}</span>}
                      {card.showBadges !== false && !!apiItem?.is_new && <span className="absolute top-10 right-2 text-[10px] font-bold bg-black/80 text-white rounded px-2 py-0.5">NEW</span>}
                      {card.showWishlist && (
                        <button
                          type="button"
                          className="absolute top-2 left-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-zinc-700"
                          onClick={(e) => { e.preventDefault(); toggleWishlist(id) }}
                        >
                          <span className="text-xs">{wishlist.has(String(id)) ? '♥' : '♡'}</span>
                        </button>
                      )}
                      {card.showQuickAdd && (
                        <button
                          type="button"
                          className="absolute bottom-2 left-2 rtl:left-auto rtl:right-2 w-7 h-7 bg-white hover:bg-zinc-100 text-zinc-700 rounded-full flex items-center justify-center shadow border border-zinc-200 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                          onClick={(e) => { e.preventDefault(); quickAdd(apiItem) }}
                        >
                          <ShoppingCart size={12} />
                        </button>
                      )}
                    </div>
                    <div className={`p-3 ${card.contentAlign === 'left' ? 'text-left' : card.contentAlign === 'center' ? 'text-center' : 'text-right'}`} style={{ textAlign: (card.contentAlign === 'left' ? 'left' : card.contentAlign === 'center' ? 'center' : 'right') }}>
                      <div className="text-sm font-medium truncate mb-1">{title}</div>
                      {/* מחיר */}
                      {card.showPrice !== false && (() => {
                        const reg = priceMeta.reg
                        const sale = isSale ? priceMeta.sale : undefined
                        return (
                          <div className={`text-xs flex items-baseline gap-2 w-full`} style={{ justifyContent: justifyCss(card.contentAlign) }}>
                            {sale !== undefined && Number.isFinite(sale as any) && <span className="font-semibold">₪{sale}</span>}
                            {reg !== undefined && Number.isFinite(reg as any) && (
                              <span className={sale !== undefined ? 'text-zinc-400 line-through' : ''}>₪{reg}</span>
                            )}
                          </div>
                        )
                      })()}
                      {/* סוואצ'ים/אופציות */}
                      {card.showColors !== false && Array.isArray(colorSwatches) && colorSwatches.length > 0 && (
                        <div className={`flex gap-1 mt-2 w-full`} style={{ justifyContent: justifyCss(card.contentAlign) }}>
                          {colorSwatches.map((c, i) => (
                            <span key={i} className="inline-block w-3.5 h-3.5 rounded border" style={{ background: c }} />
                          ))}
                          {moreColors > 0 && (
                            <span className="inline-flex w-3.5 h-3.5 rounded border text-[9px] items-center justify-center bg-zinc-100 text-zinc-600">+{moreColors}</span>
                          )}
                        </div>
                      )}
                      {card.showSizes && Array.isArray(textOptions) && textOptions.length > 0 && (
                        <div className={`flex gap-1 mt-2 flex-wrap w-full`} style={{ justifyContent: justifyCss(card.contentAlign) }}>
                          {textOptions.map((t, i) => (
                            <span key={i} className="text-[10px] border rounded px-1.5 py-0.5 text-zinc-600">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </a>
                  ) })()}
                </div>
              )
            })}
          </div>
        </div>
        {widget.arrows && (() => {
          const isRTL = typeof document !== 'undefined' && (document.dir === 'rtl' || document.documentElement.dir === 'rtl')
          const go = (dir: 'prev' | 'next') => {
            const el = containerRef.current
            if (!el) return
            const step = (el.clientWidth * (cardBasisPercent / 100)) // רוחב כרטיס יחיד בפיקסלים
            const delta = dir === 'prev' ? -step : step
            el.scrollTo({ left: el.scrollLeft + delta, behavior: 'smooth' })
          }
          // במצב RTL: המשמעות של חץ שמאל/ימין מתהפכת לציפיית המשתמש
          const leftClick = () => go(isRTL ? 'next' : 'prev')
          const rightClick = () => go(isRTL ? 'prev' : 'next')
          const size = (widget as any).arrowSize ?? 24
          const color = (widget as any).arrowColor ?? '#000'
          return (
            <>
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 z-10 pointer-events-auto" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); leftClick() }} style={{ color }}>
                <span style={{ fontSize: size }}>‹</span>
              </button>
              <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 z-10 pointer-events-auto" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); rightClick() }} style={{ color }}>
                <span style={{ fontSize: size }}>›</span>
              </button>
            </>
          )
        })()}
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

