import { useBuilderStore } from '@/store/useBuilderStore'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Monitor, Tablet, Smartphone, LayoutTemplate, PanelsTopLeft, ShoppingBag, Image as ImageIcon, Grid3X3, Sparkles, Rows } from 'lucide-react'
import type { PageSchema, Section, Widget } from '@/types/builder'
import { nanoid } from 'nanoid'

export function Toolbar() {
  const device = useBuilderStore((s) => s.device)
  const setDevice = useBuilderStore((s) => s.setDevice)
  const exportPage = useBuilderStore((s) => s.exportPage)
  const undo = useBuilderStore((s) => s.undo)
  const redo = useBuilderStore((s) => s.redo)
  const importPage = useBuilderStore((s) => s.importPage)
  const selected = useBuilderStore((s) => s.selected)
  const zoom = useBuilderStore((s) => s.zoom)
  const setZoom = useBuilderStore((s) => s.setZoom)
  const setServerMeta = useBuilderStore((s) => s.setServerMeta)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const page = useBuilderStore((s) => s.page)
  const storeSlug = useBuilderStore((s) => s.storeSlug)
  const etag = useBuilderStore((s) => s.etag)

  const onExport = () => {
    const json = JSON.stringify(exportPage(), null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'page.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const localKey = useMemo(() => (storeSlug ? `quickshop:builder:draft:${storeSlug}` : 'QS_PREVIEW_PAGE'), [storeSlug])

  const load = useCallback(async (mode: 'draft' | 'published' = 'draft') => {
    if (!storeSlug) return
    const headers: Record<string, string> = {}
    if (etag) headers['If-None-Match'] = etag
    const res = await fetch(`/api/stores/${storeSlug}/home?mode=${mode}`, { credentials: 'include', headers })
    if (res.status === 304) return
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Load failed')
    const components = Array.isArray(data.components) ? data.components : []
    importPage({ ...page, sections: components })
    setServerMeta({ etag: data.etag, updatedAt: data.updatedAt, isPublished: data.isPublished })
    try { localStorage.setItem(localKey, JSON.stringify({ page: { ...page, sections: components } })) } catch {}
  }, [storeSlug, etag, importPage, page, setServerMeta, localKey])

  const save = useCallback(async () => {
    if (!storeSlug) return
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${storeSlug}/home`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ components: page.sections, mode: 'draft' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || 'Save failed')
      const components = Array.isArray(data.components) ? data.components : []
      importPage({ ...page, sections: components })
      setServerMeta({ etag: data.etag, updatedAt: data.updatedAt, isPublished: data.isPublished })
      try { localStorage.setItem(localKey, JSON.stringify({ page: { ...page, sections: components } })) } catch {}
      // טעינה מיד אחרי שמירה כדי למשוך גרסה קנונית
      await load('draft')
      // אפשר Toast אינטגרציה אם יש ספרייה
      console.info('נשמר בהצלחה')
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }, [storeSlug, page, importPage, setServerMeta, load, localKey])

  const publish = useCallback(async () => {
    if (!storeSlug) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/stores/${storeSlug}/home`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ components: page.sections, mode: 'publish' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || 'Publish failed')
      const components = Array.isArray(data.components) ? data.components : []
      importPage({ ...page, sections: components })
      setServerMeta({ etag: data.etag, updatedAt: data.updatedAt, isPublished: data.isPublished })
      try { localStorage.setItem(localKey, JSON.stringify({ page: { ...page, sections: components } })) } catch {}
      await load('draft')
      console.info('פורסם בהצלחה')
    } catch (e) {
      console.error(e)
    } finally {
      setPublishing(false)
    }
  }, [storeSlug, page, importPage, setServerMeta, load, localKey])

  // טעינה אוטומטית אחרי רענון: ברגע שיש storeSlug נטען דראפט פעם אחת
  const didInit = useRef(false)
  useEffect(() => {
    if (!didInit.current && storeSlug) {
      didInit.current = true
      load('draft').catch(() => {})
    }
  }, [storeSlug, load])

  // מאזין לפקודות מה-Command Palette: פתיחת תבניות, שמירה, פרסום
  useEffect(() => {
    const onToolbar = (e: any) => {
      const action = e.detail?.action as 'openTemplates' | 'save' | 'publish' | undefined
      if (action === 'openTemplates') setTemplatesOpen(true)
      if (action === 'save') save()
      if (action === 'publish') publish()
    }
    window.addEventListener('qs:toolbar', onToolbar as any)
    return () => window.removeEventListener('qs:toolbar', onToolbar as any)
  }, [save, publish])

  return (
    <div className="border-b bg-white px-3 py-2 text-sm grid grid-cols-[1fr_auto_1fr] items-center">
      {/* Google Fonts preload */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;700;900&family=Heebo:wght@100;200;300;400;500;600;700;800;900&family=Varela+Round&family=Rubik:wght@300;400;500;700;900&family=Assistant:wght@200;300;400;600;700;800&family=Alef:wght@400;700&family=Secular+One&family=Open+Sans:wght@300;400;600;700&family=Roboto:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      {/* Left: Brand + tools (עבר לשמאל) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-semibold text-zinc-900">QuickShop Builder</div>
        <div className="text-zinc-500">{storeSlug ? `סלאג: ${storeSlug}` : 'סלאג: —'}</div>
        <button className="btn btn-ghost" onClick={() => undo()}>בטל</button>
        <button className="btn btn-ghost" onClick={() => redo()}>חזור</button>
        <button className="btn btn-ghost" onClick={() => {
          const event = new CustomEvent('qs:command', { detail: { open: true } })
          window.dispatchEvent(event)
        }}>פקודות ⌘K</button>
        <div className="inline-flex items-center gap-2 ml-2">
          <button className="btn btn-ghost" onClick={() => setZoom(1)}>100%</button>
          <button className="btn btn-ghost" onClick={() => setZoom(zoom - 0.1)}>-</button>
          <button className="btn btn-ghost" onClick={() => setZoom(zoom + 0.1)}>+</button>
          <span className="text-zinc-500">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Center: Device switcher with icons */}
      <div className="flex justify-center">
        <div className="inline-flex rounded overflow-hidden bg-zinc-100">
          {(['desktop', 'tablet', 'mobile'] as const).map((d) => (
            <button
              key={d}
              className={`tab ${device === d ? 'tab-active' : ''}`}
              onClick={() => setDevice(d)}
              aria-label={d === 'desktop' ? 'דסקטופ' : d === 'tablet' ? 'טאבלט' : 'מובייל'}
              title={d === 'desktop' ? 'דסקטופ' : d === 'tablet' ? 'טאבלט' : 'מובייל'}
            >
              {d === 'desktop' ? <Monitor size={16} /> : d === 'tablet' ? <Tablet size={16} /> : <Smartphone size={16} />}
            </button>
          ))}
        </div>
      </div>
      {/* Right: Save + Templates (עבר לימין) */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button className="btn btn-ghost" onClick={() => setTemplatesOpen(true)}>תבניות</button>
        <button className="btn btn-ghost" onClick={() => {
          const data = { page };
          try { localStorage.setItem(localKey, JSON.stringify(data)); } catch {}
          const url = import.meta.env.DEV ? '/preview-dev.html' : `${import.meta.env.BASE_URL}preview.html`;
          // אם אין קובץ HTML ייעודי, אפשר לדף בית שמטען preview.js
          window.open(url, '_blank');
        }}>תצוגה מקדימה</button>
        <button className="btn" disabled={saving || !storeSlug} style={{ background: '#111', color: 'white', opacity: saving ? 0.6 : 1 }} onClick={save}>{saving ? 'שומר…' : 'שמור'}</button>
        <button className="btn" disabled={publishing || !storeSlug} style={{ background: '#6d28d9', color: 'white', opacity: publishing ? 0.6 : 1 }} onClick={publish}>{publishing ? 'מפרסם…' : 'פרסום'}</button>
      </div>
      {templatesOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-24 z-50" onClick={() => setTemplatesOpen(false)}>
          <div className="w-[720px] rounded-lg bg-white shadow-xl border" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold">תבניות דף בית</div>
              <div className="flex items-center gap-2">
                <button className="btn btn-primary" onClick={onExport}>ייצוא</button>
                <label className="btn btn-ghost cursor-pointer">
                  ייבוא
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const text = await file.text()
                      try { importPage(JSON.parse(text)); setTemplatesOpen(false) } catch {}
                    }}
                  />
                </label>
                <button className="btn btn-ghost" onClick={() => setTemplatesOpen(false)}>סגור</button>
              </div>
            </div>
            <TemplatesGrid onUse={(sections, name) => {
              const pageFromTemplate = createPageFromTemplate(sections, name)
              importPage(pageFromTemplate)
              setTemplatesOpen(false)
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

function createPageFromTemplate(sections: Section[], name: string): PageSchema {
  function regenWidgetIds(w: Widget): Widget {
    const clone = JSON.parse(JSON.stringify(w)) as Widget
    clone.id = nanoid()
    if (clone.type === 'container') {
      if ((clone as any).columnsChildren) {
        const cols = (clone as any).columnsChildren as Widget[][]
        ;(clone as any).columnsChildren = cols.map(col => col.map(regenWidgetIds))
      }
      if ((clone as any).children) {
        (clone as any).children = ((clone as any).children as Widget[]).map(regenWidgetIds)
      }
    }
    return clone
  }
  const page: PageSchema = {
    id: nanoid(),
    name,
    sections: sections.map((s) => ({
      ...JSON.parse(JSON.stringify(s)),
      id: nanoid(),
      widgets: s.widgets.map(regenWidgetIds),
    })),
  }
  return page
}

function TemplatesGrid({ onUse }: { onUse: (sections: Section[], name: string) => void }) {
  const templates: Array<{ key: string; name: string; icon: React.ReactNode; description: string; sections: Section[] }> = useMemo(() => ([
    // 1) חנות קלאסית — הירו, יתרונות, סליידר, CTA
    {
      key: 'classic-storefront',
      name: 'חנות קלאסית',
      icon: <LayoutTemplate size={18} />,
      description: 'עמוד בית שלם: הירו פתיח, יתרונות, מוצרים נבחרים וקריאה לפעולה.',
      sections: [
        { id: 's1', container: 'fixed', style: { maxWidth: '1140px', margin: { bottom: 0 } }, widgets: [
          { id: 'w1', type: 'banner', visible: true, overlayColor: 'rgba(0,0,0,0.45)', heading: '<strong>ברוכים הבאים</strong>', text: 'קולקציה חדשה נחתה', ctaLabel: 'גלו עוד', ctaHref: '#', contentPosition: { horizontal: 'center', vertical: 'center' }, headingStyle: { fontSize: 36, fontWeight: 700, color: '#ffffff' }, textStyle: { fontSize: 18, color: '#ffffff' }, buttonStyle: { background: '#7c3aed', color: '#fff', borderRadius: 6 }, style: { minHeight: 320 } as any } as any,
        ] },
        { id: 's2', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [
          { id: 'w2', type: 'container', visible: true, flex: { direction: 'row', gap: 16 }, columns: 3, columnsChildren: [
            [ { id: 'h1', type: 'heading', visible: true, content: 'משלוח מהיר', tag: 'h3', style: { fontSize: 20, lineHeight: 1 } }, { id: 't1', type: 'text', visible: true, content: 'עד הבית, בזמן שיא.', style: { fontSize: 14, lineHeight: 1, padding: { top: 8, right: 8, bottom: 8, left: 8 } } } ],
            [ { id: 'h2', type: 'heading', visible: true, content: 'החזרה קלה', tag: 'h3', style: { fontSize: 20, lineHeight: 1 } }, { id: 't2', type: 'text', visible: true, content: '30 יום להתחרט בנחת.', style: { fontSize: 14, lineHeight: 1, padding: { top: 8, right: 8, bottom: 8, left: 8 } } } ],
            [ { id: 'h3', type: 'heading', visible: true, content: 'שירות אישי', tag: 'h3', style: { fontSize: 20, lineHeight: 1 } }, { id: 't3', type: 'text', visible: true, content: 'אנחנו תמיד כאן בשבילך.', style: { fontSize: 14, lineHeight: 1, padding: { top: 8, right: 8, bottom: 8, left: 8 } } } ],
          ], children: [] } as any
        ] },
        { id: 's3', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'w3', type: 'productSlider', visible: true, title: 'מוצרים נבחרים', productIds: [], slidesPerView: { desktop: 4, tablet: 2, mobile: 1 }, arrows: true, dots: false, autoplay: false, style: {} } as any ] },
        { id: 's4', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'w4', type: 'banner', visible: true, overlayColor: 'rgba(0,0,0,0.6)', heading: '<strong>מצטרפים למועדון?</strong>', text: 'קבלו הטבות בלעדיות ועדכונים חמים', ctaLabel: 'הצטרפו עכשיו', ctaHref: '#', contentPosition: { horizontal: 'center', vertical: 'center' }, headingStyle: { fontSize: 30, fontWeight: 700, color: '#ffffff' }, textStyle: { fontSize: 16, color: '#ffffff' }, buttonStyle: { background: '#7c3aed', color: '#fff', borderRadius: 6 }, style: { minHeight: 220 } as any } as any ] },
      ],
    },

    // 2) הירו + כותרת + טקסט + הירו + CTA
    {
      key: 'hero-heading-text-cta',
      name: 'הירו + תכנים + CTA',
      icon: <PanelsTopLeft size={18} />,
      description: 'פתיח חזק, בלוק תוכן קריאתי, הירו נוסף לחידוד ומסיים בקריאה לפעולה.',
      sections: [
        { id: 's1', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'b1', type: 'banner', visible: true, overlayColor: 'rgba(0,0,0,0.35)', heading: '<strong>קולקציה חדשה</strong>', text: 'הטרנדים החמים של העונה', ctaLabel: 'לגלריה', ctaHref: '#', contentPosition: { horizontal: 'center', vertical: 'center' }, headingStyle: { fontSize: 34, fontWeight: 700, color: '#ffffff' }, textStyle: { fontSize: 16, color: '#ffffff' }, buttonStyle: { background: '#111', color: '#fff', borderRadius: 6 }, style: { minHeight: 300 } as any } as any ] },
        { id: 's2', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'h1', type: 'heading', visible: true, content: 'למה לבחור בנו?', tag: 'h2', style: { fontSize: 28, lineHeight: 1 } }, { id: 't1', type: 'text', visible: true, content: 'איכות בלתי מתפשרת, משלוח מהיר ושירות אישי — חווית קנייה אחרת.', style: { fontSize: 16, lineHeight: 1, padding: { top: 12, right: 12, bottom: 12, left: 12 } } } ] },
        { id: 's3', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'b2', type: 'banner', visible: true, overlayColor: 'rgba(0,0,0,0.25)', heading: '<strong>בחרו את הסטייל</strong>', text: 'אלגנטי, קז׳ואל או ספורטיבי — הכל במקום אחד', ctaLabel: 'רכשו עכשיו', ctaHref: '#', contentPosition: { horizontal: 'center', vertical: 'center' }, headingStyle: { fontSize: 28, fontWeight: 700, color: '#ffffff' }, textStyle: { fontSize: 16, color: '#ffffff' }, buttonStyle: { background: '#7c3aed', color: '#fff', borderRadius: 6 }, style: { minHeight: 220 } as any } as any ] },
        { id: 's4', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'cta1', type: 'button', visible: true, label: 'התחילו לקנות', href: '#', style: { background: '#7c3aed', color: '#fff', padding: { top: 10, bottom: 10, left: 16, right: 16 } } } ] },
      ],
    },

    // 3) שני טורים + סליידר + CTA
    {
      key: 'split-feature',
      name: 'שני טורים + סליידר + CTA',
      icon: <Rows size={18} />,
      description: 'פריסת עמודות, ויז׳ואל לצד מסר, המשך למוצרים וסיום בקריאה לפעולה.',
      sections: [
        { id: 's1', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'h1', type: 'heading', visible: true, content: 'הסיפור שלנו', tag: 'h2', style: { fontSize: 28, lineHeight: 1 } }, { id: 't1', type: 'text', visible: true, content: 'מוצרי איכות, עיצוב מוקפד וקהילה נאמנה — כך בונים מותג.', style: { fontSize: 16, lineHeight: 1, padding: { top: 12, right: 12, bottom: 12, left: 12 } } } ] },
        { id: 's2', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [
          { id: 'w1', type: 'container', visible: true, flex: { direction: 'row', gap: 16 }, columns: 2, columnsChildren: [
            [ { id: 'h2', type: 'heading', visible: true, content: 'למה דווקא אנחנו', tag: 'h3', style: { fontSize: 22, lineHeight: 1 } }, { id: 't2', type: 'text', visible: true, content: 'כי אכפת לנו מהמלאכה, מהחומרים ומהלקוחות.', style: { fontSize: 15, lineHeight: 1, padding: { top: 8, right: 8, bottom: 8, left: 8 } } } ],
            [ { id: 'img1', type: 'image', visible: true, src: 'https://picsum.photos/800/500', style: { borderRadius: 8 } } ]
          ], children: [] } as any
        ] },
        { id: 's3', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'ps1', type: 'productSlider', visible: true, title: 'חדש על המדף', productIds: [], slidesPerView: { desktop: 4, tablet: 2, mobile: 1 }, arrows: true, dots: true, autoplay: false, style: {} } as any ] },
        { id: 's4', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'cta2', type: 'banner', visible: true, overlayColor: 'rgba(0,0,0,0.5)', heading: '<strong>מוכנים להזמין?</strong>', text: 'שליח עד הבית תוך 48 שעות', ctaLabel: 'הוסיפו לעגלה', ctaHref: '#', contentPosition: { horizontal: 'center', vertical: 'center' }, headingStyle: { fontSize: 28, fontWeight: 700, color: '#ffffff' }, textStyle: { fontSize: 16, color: '#ffffff' }, buttonStyle: { background: '#7c3aed', color: '#fff', borderRadius: 6 }, style: { minHeight: 200 } as any } as any ] },
      ],
    },

    // 4) גלריה ממוקדת
    {
      key: 'gallery',
      name: 'גלריית השראה מלאה',
      icon: <ImageIcon size={18} />,
      description: 'פתיח קצר, גלריה תדמיתית ורכיב CTA לסיום.',
      sections: [
        { id: 's1', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'h1', type: 'heading', visible: true, content: 'השראה לעיצוב יומיומי', tag: 'h2', style: { fontSize: 28, lineHeight: 1 } }, { id: 't1', type: 'text', visible: true, content: 'אוספים ויזואלים שידליקו לכם רעיונות לשילובים מנצחים.', style: { fontSize: 16, lineHeight: 1, padding: { top: 12, right: 12, bottom: 12, left: 12 } } } ] },
        { id: 's2', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'w1', type: 'gallery', visible: true, images: [], columns: 3, gap: 12, style: {} } as any ] },
        { id: 's3', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'cta3', type: 'button', visible: true, label: 'צפו בכל הקולקציות', href: '#', style: { background: '#7c3aed', color: '#fff', padding: { top: 10, bottom: 10, left: 16, right: 16 } } } ] },
      ],
    },

    // 5) עמוד סייל
    {
      key: 'marquee-sale',
      name: 'דף סייל',
      icon: <Sparkles size={18} />,
      description: 'פס רץ להכרזה, הירו מבצע, מוצרים חמים וקריאה לפעולה.',
      sections: [
        { id: 's0', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'mq1', type: 'marquee', visible: true, text: 'סייל! עד 50% הנחה • משלוח חינם מעל 199₪', speed: 30, style: {} } as any ] },
        { id: 's1', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'b1', type: 'banner', visible: true, overlayColor: 'rgba(0,0,0,0.6)', heading: '<strong>סוף עונה</strong>', text: 'הנחות מטורפות על מגוון פריטים', ctaLabel: 'לכל המבצעים', ctaHref: '#', contentPosition: { horizontal: 'center', vertical: 'center' }, headingStyle: { fontSize: 34, fontWeight: 800, color: '#ffffff' }, textStyle: { fontSize: 18, color: '#ffffff' }, buttonStyle: { background: '#7c3aed', color: '#fff', borderRadius: 6 }, style: { minHeight: 280 } as any } as any ] },
        { id: 's2', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'ps1', type: 'productSlider', visible: true, title: 'חם עכשיו', productIds: [], slidesPerView: { desktop: 4, tablet: 2, mobile: 1 }, arrows: true, dots: true, autoplay: true, style: {} } as any ] },
        { id: 's3', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'cta4', type: 'button', visible: true, label: 'קנו לפני שנגמר', href: '#', style: { background: '#111', color: '#fff', padding: { top: 10, bottom: 10, left: 16, right: 16 } } } ] },
      ],
    },

    // 6) מינימליסטי ממיר (מורחב)
    {
      key: 'minimal-cta',
      name: 'מינימליסטי ממיר',
      icon: <ShoppingBag size={18} />,
      description: 'כותרת חזקה, טקסט קצר, מוצרים מובילים ובאנר CTA מסכם.',
      sections: [
        { id: 's1', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'h1', type: 'heading', visible: true, content: 'הכי נמכרים אצלנו', tag: 'h2', style: { fontSize: 28, lineHeight: 1 } }, { id: 't1', type: 'text', visible: true, content: 'פריטים שנחטפים בכל יום — אל תפספסו.', style: { fontSize: 16, lineHeight: 1, padding: { top: 12, right: 12, bottom: 12, left: 12 } } }, { id: 'b1', type: 'button', visible: true, label: 'לכל המוצרים', href: '#', style: { background: '#7c3aed', color: '#fff', padding: { top: 8, bottom: 8, left: 12, right: 12 } } } ] },
        { id: 's2', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'ps1', type: 'productSlider', visible: true, title: 'מומלצים בשבילך', productIds: [], slidesPerView: { desktop: 4, tablet: 2, mobile: 1 }, arrows: true, dots: false, autoplay: false, style: {} } as any ] },
        { id: 's3', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'b2', type: 'banner', visible: true, overlayColor: 'rgba(0,0,0,0.4)', heading: '<strong>הטבות מועדון</strong>', text: 'צוברים נקודות וקונים חכם', ctaLabel: 'הצטרפו עכשיו', ctaHref: '#', contentPosition: { horizontal: 'center', vertical: 'center' }, headingStyle: { fontSize: 28, fontWeight: 700, color: '#ffffff' }, textStyle: { fontSize: 16, color: '#ffffff' }, buttonStyle: { background: '#111', color: '#fff', borderRadius: 6 }, style: { minHeight: 200 } as any } as any ] },
      ],
    },

    // 7) סיפור מותג
    {
      key: 'brand-story',
      name: 'סיפור המותג',
      icon: <LayoutTemplate size={18} />,
      description: 'עמוד שמספר את הערכים והסיפור מאחורי המותג, עם CTA בסוף.',
      sections: [
        { id: 's1', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'h1', type: 'heading', visible: true, content: 'מי אנחנו', tag: 'h2', style: { fontSize: 30, lineHeight: 1 } }, { id: 't1', type: 'text', visible: true, content: 'התחלנו בסטודיו קטן עם חלום גדול — להביא איכות ללא פשרות.', style: { fontSize: 16, lineHeight: 1, padding: { top: 12, right: 12, bottom: 12, left: 12 } } } ] },
        { id: 's2', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [
          { id: 'c1', type: 'container', visible: true, flex: { direction: 'row', gap: 16 }, columns: 2, columnsChildren: [
            [ { id: 't2', type: 'text', visible: true, content: 'אנחנו בוחרים חומרים ברי קיימא ומייצרים באהבה.', style: { fontSize: 15, lineHeight: 1, padding: { top: 8, right: 8, bottom: 8, left: 8 } } } ],
            [ { id: 'img1', type: 'image', visible: true, src: 'https://picsum.photos/700/500', style: { borderRadius: 8 } } ]
          ], children: [] } as any
        ] },
        { id: 's3', container: 'fixed', style: { maxWidth: '1140px' }, widgets: [ { id: 'b2', type: 'button', visible: true, label: 'צפו במוצרים שלנו', href: '#', style: { background: '#7c3aed', color: '#fff', padding: { top: 10, bottom: 10, left: 16, right: 16 } } } ] },
      ],
    },
  ]), [])

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {templates.map((t) => (
        <div key={t.key} className="border rounded p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-700"><span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-100">{t.icon}</span><span className="font-medium">{t.name}</span></div>
          <div className="text-xs text-zinc-500 leading-5">{t.description}</div>
          <div className="mt-2 flex justify-end">
            <button className="btn btn-primary" onClick={() => onUse(t.sections as any, t.name)}>השתמש</button>
          </div>
        </div>
      ))}
    </div>
  )
}

