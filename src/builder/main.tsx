import React from 'react'
import ReactDOM from 'react-dom/client'
import '../index.css'
import { App } from '@/ui/App'
import { useBuilderStore } from '@/store/useBuilderStore'

// אופציונלי: ניתן לקרוא כאן ל-window.__BUILDER_BOOTSTRAP__ כדי להזריק נתונים ל-store אם צריך

ReactDOM.createRoot(document.getElementById('builder-root') || document.getElementById('root')!).render(
  <React.StrictMode>
    <Bootstrapper>
      <App />
    </Bootstrapper>
  </React.StrictMode>
)

function Bootstrapper({ children }: { children: React.ReactNode }) {
  const setBootstrap = useBuilderStore((s) => s.setBootstrap)
  // קרא bootstrap אם קיים, אחרת נסה localStorage
  React.useEffect(() => {
    const anyWin = window as any
    const bootstrap = anyWin.__BUILDER_BOOTSTRAP__ as
      | { storeSlug?: string; components?: any[]; etag?: string; updatedAt?: string; isPublished?: boolean }
      | undefined
    if (bootstrap) {
      setBootstrap({
        storeSlug: bootstrap.storeSlug,
        components: (bootstrap as any).page?.sections || bootstrap.components,
        etag: (bootstrap as any).etag,
        updatedAt: (bootstrap as any).updatedAt,
        isPublished: (bootstrap as any).isPublished,
      })
    } else {
      try {
        const raw = localStorage.getItem('quickshop:bootstrap:last')
        if (raw) {
          const parsed = JSON.parse(raw)
          setBootstrap(parsed)
        }
      } catch {}
    }
  }, [setBootstrap])
  return <>{children}</>
}

