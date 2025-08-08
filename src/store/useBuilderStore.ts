import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { PageSchema, Section, Widget, SelectedTarget } from '@/types/builder'
import { produce } from 'immer'

type BuilderState = {
  page: PageSchema
  selected?: SelectedTarget
  device: 'desktop' | 'tablet' | 'mobile'
  past: PageSchema[]
  future: PageSchema[]
  zoom: number
  // Server/meta
  storeSlug?: string
  etag?: string
  updatedAt?: string
  isPublished?: boolean
}

type BuilderActions = {
  setDevice: (d: BuilderState['device']) => void
  setZoom: (z: number) => void
  select: (target?: SelectedTarget) => void
  setBootstrap: (data: { storeSlug?: string; components?: Section[]; etag?: string; updatedAt?: string; isPublished?: boolean }) => void
  setServerMeta: (meta: { etag?: string; updatedAt?: string; isPublished?: boolean }) => void
  clearPage: () => void
  addSection: () => void
  removeSection: (sectionId: string) => void
  moveSection: (sectionId: string, toIndex: number) => void
  updateSection: (sectionId: string, updater: (s: Section) => void) => void
  duplicateSection: (sectionId: string) => void
  addWidget: (sectionId: string, widget: Omit<Widget, 'id'>) => void
  addWidgetAt: (sectionId: string, widget: Omit<Widget, 'id'>, index: number) => void
  addChildWidget: (containerWidgetId: string, widget: Omit<Widget, 'id'>, columnIndex?: number) => void
  addChildWidgetAt: (containerWidgetId: string, widget: Omit<Widget, 'id'>, columnIndex: number, index: number) => void
  updateWidget: (widgetId: string, updater: (w: Widget) => void) => void
  moveWidget: (widgetId: string, toSectionId: string, toIndex: number) => void
  removeWidget: (widgetId: string) => void
  duplicateWidget: (widgetId: string) => void
  importPage: (schema: PageSchema) => void
  exportPage: () => PageSchema
  undo: () => void
  redo: () => void
}

const initialPage: PageSchema = {
  id: nanoid(),
  name: 'עמוד בית חדש',
  sections: [
    {
      id: nanoid(),
      container: 'fixed',
      widgets: [],
      style: { margin: { bottom: 0 }, width: '100%', maxWidth: '1140px' },
    },
  ],
}

export const useBuilderStore = create<BuilderState & BuilderActions>()(
  devtools((set, get) => ({
    page: initialPage,
    device: 'desktop',
    selected: undefined,
    past: [],
    future: [],
    zoom: 1,
    storeSlug: undefined,
    etag: undefined,
    updatedAt: undefined,
    isPublished: undefined,

    undo: () => {
      const { past, page, future } = get()
      if (past.length === 0) return
      const previous = past[past.length - 1]
      set({ page: previous, past: past.slice(0, -1), future: [page, ...future] }, false, 'undo')
    },
    redo: () => {
      const { past, page, future } = get()
      if (future.length === 0) return
      const next = future[0]
      set({ page: next, past: [...past, page], future: future.slice(1) }, false, 'redo')
    },

    setDevice: (d) => set({ device: d }, false, 'setDevice'),
    setZoom: (z) => set({ zoom: Math.max(0.5, Math.min(2, z)) }, false, 'setZoom'),
    select: (target) => set({ selected: target }, false, 'select'),
    setBootstrap: (data) => set(
      produce<BuilderState>((draft) => {
        if (data.storeSlug !== undefined) draft.storeSlug = data.storeSlug
        if (data.etag !== undefined) draft.etag = data.etag
        if (data.updatedAt !== undefined) draft.updatedAt = data.updatedAt
        if (data.isPublished !== undefined) draft.isPublished = data.isPublished
        if (data.components) {
          draft.page.sections = Array.isArray(data.components) ? data.components : []
        }
      }),
      false,
      'setBootstrap',
    ),
    setServerMeta: (meta) => set(
      produce<BuilderState>((draft) => {
        if (meta.etag !== undefined) draft.etag = meta.etag
        if (meta.updatedAt !== undefined) draft.updatedAt = meta.updatedAt
        if (meta.isPublished !== undefined) draft.isPublished = meta.isPublished
      }),
      false,
      'setServerMeta',
    ),
    clearPage: () => set(
      produce<BuilderState>((draft) => {
        draft.past.push(JSON.parse(JSON.stringify(draft.page)))
        draft.future = []
        draft.page.sections = []
        draft.selected = undefined
      }),
      false,
      'clearPage',
    ),
    addSection: () =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          draft.page.sections.push({ id: nanoid(), widgets: [], container: 'fixed', style: { margin: { bottom: 0 }, width: '100%', maxWidth: '1140px' } })
        }),
        false,
        'addSection',
      ),
    removeSection: (sectionId) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          draft.page.sections = draft.page.sections.filter((s) => s.id !== sectionId)
          if (draft.selected?.kind === 'section' && draft.selected.id === sectionId) draft.selected = undefined
        }),
        false,
        'removeSection',
      ),
    moveSection: (sectionId, toIndex) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          const fromIndex = draft.page.sections.findIndex((s) => s.id === sectionId)
          if (fromIndex === -1) return
          const clamped = Math.max(0, Math.min(toIndex, draft.page.sections.length - 1))
          const [sec] = draft.page.sections.splice(fromIndex, 1)
          draft.page.sections.splice(clamped, 0, sec)
        }),
        false,
        'moveSection',
      ),
    updateSection: (sectionId, updater) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          const section = draft.page.sections.find((s) => s.id === sectionId)
          if (!section) return
          updater(section)
        }),
        false,
        'updateSection',
      ),
    duplicateSection: (sectionId) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          const idx = draft.page.sections.findIndex((s) => s.id === sectionId)
          if (idx === -1) return
          const original = draft.page.sections[idx]
          const clone = JSON.parse(JSON.stringify(original)) as Section
          clone.id = nanoid()
          // assign new ids to widgets
          clone.widgets = clone.widgets.map((w) => ({ ...w, id: nanoid() }))
          draft.page.sections.splice(idx + 1, 0, clone)
        }),
        false,
        'duplicateSection',
      ),
    addWidget: (sectionId, widget) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          const section = draft.page.sections.find((s) => s.id === sectionId)
          if (!section) return
          const newId = nanoid()
          section.widgets.push({ ...widget, id: newId } as Widget)
          draft.selected = { kind: 'widget', id: newId }
        }),
        false,
        'addWidget',
      ),
    addWidgetAt: (sectionId, widget, index) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          const section = draft.page.sections.find((s) => s.id === sectionId)
          if (!section) return
          const newId = nanoid()
          section.widgets.splice(Math.max(0, Math.min(index, section.widgets.length)), 0, { ...widget, id: newId } as Widget)
          draft.selected = { kind: 'widget', id: newId }
        }),
        false,
        'addWidgetAt',
      ),
    addChildWidget: (containerWidgetId, widget, columnIndex = 0) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          function addToChildren() {
            for (const section of draft.page.sections) {
              for (const child of section.widgets) {
                if (child.id === containerWidgetId && child.type === 'container') {
                  const newId = nanoid()
                  if ((child as any).columns && (child as any).columnsChildren) {
                    const cols = (child as any).columns
                    const arr = (child as any).columnsChildren as any[]
                    const idx = Math.max(0, Math.min(columnIndex, cols - 1))
                    arr[idx] = [ ...(arr[idx] ?? []), { ...widget, id: newId } ]
                    ;(child as any).columnsChildren = arr
                  } else {
                    (child as any).children = [ ...(child as any).children ?? [], { ...widget, id: newId } ]
                  }
                  draft.selected = { kind: 'widget', id: newId }
                  return true
                }
              }
            }
            return false
          }
          addToChildren()
        }),
        false,
        'addChildWidget',
      ),
    addChildWidgetAt: (containerWidgetId, widget, columnIndex, index) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          for (const section of draft.page.sections) {
            for (const w of section.widgets) {
              if (w.id === containerWidgetId && w.type === 'container') {
                const newId = nanoid()
                if ((w as any).columns && (w as any).columnsChildren) {
                  const cols = (w as any).columns
                  const arr = (w as any).columnsChildren as any[]
                  const col = Math.max(0, Math.min(columnIndex, cols - 1))
                  const list = arr[col] ?? []
                  const pos = Math.max(0, Math.min(index, list.length))
                  list.splice(pos, 0, { ...widget, id: newId } as any)
                  arr[col] = list
                  ;(w as any).columnsChildren = arr
                }
                draft.selected = { kind: 'widget', id: newId }
                return
              }
            }
          }
        }),
        false,
        'addChildWidgetAt',
      ),
    updateWidget: (widgetId, updater) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          for (const section of draft.page.sections) {
            // חיפוש ברמה העליונה
            const w = section.widgets.find((w) => w.id === widgetId)
            if (w) { updater(w); return }
            // חיפוש בתוך עמודות של קונטיינר
            for (const cw of section.widgets) {
              if (cw.type === 'container' && (cw as any).columnsChildren) {
                const cols = (cw as any).columnsChildren as any[]
                for (const col of cols) {
                  const idx = col.findIndex((child: Widget) => child.id === widgetId)
                  if (idx !== -1) { updater(col[idx]); return }
                }
              }
            }
          }
        }),
        false,
        'updateWidget',
      ),
    moveWidget: (widgetId, toSectionId, toIndex) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          let moving: Widget | undefined
          let fromSection: Section | undefined
          let fromIndex = -1
          for (const section of draft.page.sections) {
            const idx = section.widgets.findIndex((w) => w.id === widgetId)
            if (idx !== -1) {
              moving = section.widgets[idx]
              fromSection = section
              fromIndex = idx
              break
            }
          }
          if (!moving) return
          fromSection!.widgets.splice(fromIndex, 1)
          const toSection = draft.page.sections.find((s) => s.id === toSectionId)
          if (!toSection) return
          toSection.widgets.splice(Math.max(0, Math.min(toIndex, toSection.widgets.length)), 0, moving)
        }),
        false,
        'moveWidget',
      ),
    removeWidget: (widgetId) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          for (const section of draft.page.sections) {
            // הסרה ברמה העליונה
            const idx = section.widgets.findIndex((w) => w.id === widgetId)
            if (idx !== -1) { section.widgets.splice(idx, 1); break }
            // הסרה בתוך עמודות
            for (const cw of section.widgets) {
              if (cw.type === 'container' && (cw as any).columnsChildren) {
                const cols = (cw as any).columnsChildren as any[]
                for (let c = 0; c < cols.length; c++) {
                  const list = cols[c]
                  const i = list.findIndex((child: Widget) => child.id === widgetId)
                  if (i !== -1) { list.splice(i, 1); cols[c] = list; (cw as any).columnsChildren = cols; break }
                }
              }
            }
          }
          if (draft.selected?.kind === 'widget' && draft.selected.id === widgetId) draft.selected = undefined
        }),
        false,
        'removeWidget',
      ),
    duplicateWidget: (widgetId) =>
      set(
        produce<BuilderState>((draft) => {
          draft.past.push(JSON.parse(JSON.stringify(draft.page)))
          draft.future = []
          for (const section of draft.page.sections) {
            // שכפול ברמה העליונה
            let idx = section.widgets.findIndex((w) => w.id === widgetId)
            if (idx !== -1) {
              const copy = JSON.parse(JSON.stringify(section.widgets[idx])) as Widget
              copy.id = nanoid()
              section.widgets.splice(idx + 1, 0, copy)
              return
            }
            // שכפול בתוך עמודות
            for (const cw of section.widgets) {
              if (cw.type === 'container' && (cw as any).columnsChildren) {
                const cols = (cw as any).columnsChildren as any[]
                for (let c = 0; c < cols.length; c++) {
                  const list = cols[c]
                  idx = list.findIndex((child: Widget) => child.id === widgetId)
                  if (idx !== -1) {
                    const copy = JSON.parse(JSON.stringify(list[idx])) as Widget
                    copy.id = nanoid()
                    list.splice(idx + 1, 0, copy)
                    cols[c] = list
                    ;(cw as any).columnsChildren = cols
                    return
                  }
                }
              }
            }
          }
        }),
        false,
        'duplicateWidget',
      ),
    importPage: (schema) => set({ page: schema }, false, 'importPage'),
    exportPage: () => get().page,
  }))
)

