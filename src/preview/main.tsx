import React from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import { WidgetRenderer } from '@/ui/builder/WidgetRenderer'
import { useState } from 'react'
import type { PageSchema, StyleValues } from '@/types/builder'

function PreviewApp() {
  const bootstrap = (window as any).__PREVIEW_BOOTSTRAP__
  const storeSlug: string | undefined = bootstrap?.storeSlug || (window as any).STORE_SLUG
  const localKey = storeSlug ? `quickshop:builder:draft:${storeSlug}` : 'QS_PREVIEW_PAGE'
  const [data] = useState<any>(() => bootstrap || (() => { try { const raw = localStorage.getItem(localKey); return raw ? JSON.parse(raw) : null } catch { return null } })() || (window as any).STORE_DATA || {})
  const page: PageSchema | undefined = data?.page || (data?.components ? { id: 'preview', name: 'עמוד', sections: data.components } as any : undefined)
  // Fallback אם מגיע בפורמט { components }
  const sections = (page?.sections ?? [])
  if (!page) return <div className="p-8 text-center text-sm text-zinc-500">אין נתוני תצוגה. פתחו מהבילדר או הטעינו דרך השרת.</div>
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
  return (
    <main className="bg-white">
      {/* טעינת גופנים כמו בבילדר */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;700;900&family=Heebo:wght@100;200;300;400;500;600;700;800;900&family=Varela+Round&family=Rubik:wght@300;400;500;700;900&family=Assistant:wght@200;300;400;600;700;800&family=Alef:wght@400;700&family=Secular+One&family=Open+Sans:wght@300;400;600;700&family=Roboto:wght@300;400;500;700;900&family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <div className="w-full">
        {sections.map((section, si) => (
          <section
            key={section.id}
            className="py-3"
            style={{
              ...styleToCss(section.style),
              // יישור למרכז כמו בבילדר
              marginLeft: 'auto',
              marginRight: 'auto',
              width: '100%',
            }}
          >
            <div className="w-full" style={(section.style?.maxWidth ?? '1140px') === '100%' ? { width: '100%' } : { maxWidth: section.style?.maxWidth ?? '1140px', marginLeft: 'auto', marginRight: 'auto' }}>
              {section.widgets.map((w, idx) => (
                <div key={w.id} className="py-1">
                  <WidgetRenderer widget={w} sectionId={section.id} index={idx} draggable={false} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

// ודא שיש root גם אם נטען בלי ה-HTML הייעודי
let mount = document.getElementById('page-preview-root') || document.getElementById('root')
if (!mount) {
  const div = document.createElement('div')
  div.id = 'page-preview-root'
  document.body.appendChild(div)
  mount = div
}
ReactDOM.createRoot(mount!).render(
  <React.StrictMode>
    <PreviewApp />
  </React.StrictMode>
)

