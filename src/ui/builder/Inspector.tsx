import { useBuilderStore } from '@/store/useBuilderStore'
import type { Widget } from '@/types/builder'
import { useMemo, useState } from 'react'
import { Field, TextInput, NumberInputUI, Select, ColorPicker } from '@/ui/controls/Controls'
import { Accordion } from '@/ui/controls/Accordion'
import { Type, Link2, Palette, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, List, Eye, EyeOff, TypeIcon, Frame, MoveVertical, MoveHorizontal, Circle, UploadCloud } from 'lucide-react'
import { StyleControls } from './StyleControls'
import { MousePointerSquareDashed, Edit3, Settings2 } from 'lucide-react'

function NumberInput({ label, value, onChange, icon }: { label: string; value?: number | string; onChange: (v?: number) => void; icon?: React.ReactNode }) {
  return (
    <Field label={label} icon={icon}>
      <NumberInputUI className="w-16 h-8" value={value ?? '' as any} onChange={(e) => onChange((e.target as HTMLInputElement).value === '' ? undefined : Number((e.target as HTMLInputElement).value))} />
    </Field>
  )
}

function labelForWidgetType(type: Widget['type']): string {
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
    case 'container': return 'עמודות'
    default: return 'אלמנט'
  }
}

function ColorInput({ label, value, onChange, icon }: { label: string; value?: string; onChange: (v?: string) => void; icon?: React.ReactNode }) {
  return (
    <Field label={label} icon={icon}>
      <ColorPicker value={value} onChange={onChange} />
    </Field>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="text-sm flex items-center gap-2">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

export function Inspector() {
  const selected = useBuilderStore((s) => s.selected)
  const page = useBuilderStore((s) => s.page)
  const updateWidget = useBuilderStore((s) => s.updateWidget)
  const device = useBuilderStore((s) => s.device)
  const select = useBuilderStore((s) => s.select)
  const [tab, setTab] = useState<'general' | 'style' | 'advanced'>('general')
  const [mediaModal, setMediaModal] = useState<null | { kind: 'image' | 'video'; widgetId: string }>(null)
  const [assets, setAssets] = useState<Array<{ kind: 'image' | 'video'; url: string }>>([])
  // כאשר נבחר אלמנט חדש, חזור ללשונית "כללי" לפתיחת ההגדרות
  useMemo(() => {
    // טריק זעיר: שינוי selected יפעיל את ה-hook
    setTab('general')
    return null
  }, [selected?.kind, selected?.id])

  const selectedWidget = useMemo<Widget | undefined>(() => {
    if (selected?.kind !== 'widget') return undefined
    for (const section of page.sections) {
      // חיפוש ברמה העליונה
      const direct = section.widgets.find((w) => w.id === selected.id)
      if (direct) return direct
      // חיפוש בתוך עמודות של קונטיינר
      for (const w of section.widgets) {
        if (w.type === 'container' && (w as any).columnsChildren) {
          const cols = (w as any).columnsChildren as Widget[][]
          for (const col of cols) {
            const inCol = col.find((child) => child.id === selected.id)
            if (inCol) return inCol
          }
        }
      }
    }
  }, [page.sections, selected])

  if (!selected)
    return (
      <aside className="h-full p-0 overflow-y-auto scrollbar-thin flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <MousePointerSquareDashed size={36} />
            <div className="text-sm">בחרו אלמנט לעריכה</div>
          </div>
        </div>
      </aside>
    )

  // בחירת מקטע
  if (selected.kind === 'section') {
    const section = page.sections.find((s) => s.id === selected.id)
    if (!section) return <aside className="border-l bg-white dark:bg-zinc-950 p-4" />
    return (
      <aside className="h-full p-0 overflow-y-auto scrollbar-thin flex flex-col">
        <div className="px-3 py-2 text-center font-semibold bg-zinc-50">הגדרות שורה</div>
        <div className="border-b" />
        <div className="bg-white">
          <div className="flex">
            <button className={`tab flex-1 h-14 flex flex-col items-center justify-center ${tab === 'general' ? 'tab-active' : ''}`} onClick={() => setTab('general')}>
              <Edit3 size={16} />
              <span>כללי</span>
            </button>
            <button className={`tab flex-1 h-14 flex flex-col items-center justify-center ${tab === 'style' ? 'tab-active' : ''}`} onClick={() => setTab('style')}>
              <Palette size={16} />
              <span>עיצוב</span>
            </button>
            <button className={`tab flex-1 h-14 flex flex-col items-center justify-center ${tab === 'advanced' ? 'tab-active' : ''}`} onClick={() => setTab('advanced')}>
              <Settings2 size={16} />
              <span>מתקדם</span>
            </button>
          </div>
        </div>

        <div className="border-b" />
        <div className="p-4">
        {tab === 'general' && (
          <div className="space-y-2 mb-4 settings-group">
            <div className="settings-title">פריסת Flex</div>
            <Field label="גובה מינימלי">
              <div className="flex items-center gap-2">
                <NumberInputUI
                  className="w-20 h-8"
                  value={typeof section.style?.minHeight === 'number' ? section.style?.minHeight : (typeof section.style?.minHeight === 'string' && section.style?.minHeight.endsWith('vh') ? Number(section.style?.minHeight.replace('vh','')) : (typeof section.style?.minHeight === 'string' && section.style?.minHeight.endsWith('px') ? Number(section.style?.minHeight.replace('px','')) : (section.style?.minHeight as any)))}
                  onChange={(e) => {
                    const raw = (e.target as HTMLInputElement).value
                    const prev = section.style?.minHeight
                    const unit = typeof prev === 'string' && prev.endsWith('vh') ? 'vh' : 'px'
                    const num = raw === '' ? undefined : Number(raw)
                    useBuilderStore.getState().updateSection(section.id, (s) => {
                      s.style = { ...(s.style ?? {}), minHeight: num === undefined ? undefined : (unit === 'vh' ? `${num}vh` : `${num}px`) }
                    })
                  }}
                />
                <Select
                  value={typeof section.style?.minHeight === 'string' && section.style?.minHeight.endsWith('vh') ? 'vh' : 'px'}
                  onChange={(e) => {
                    const unit = e.target.value
                    const prev = section.style?.minHeight
                    const num = typeof prev === 'number' ? prev : (typeof prev === 'string' ? Number(prev.replace('px','').replace('vh','')) : undefined)
                    useBuilderStore.getState().updateSection(section.id, (s) => {
                      s.style = { ...(s.style ?? {}), minHeight: num === undefined ? undefined : (unit === 'vh' ? `${num}vh` : `${num}px`) }
                    })
                  }}
                >
                  <option value="px">px</option>
                  <option value="vh">vh</option>
                </Select>
              </div>
            </Field>
            <Field label="רוחב קונטיינר">
              <div className="flex items-center gap-2">
                <Select
                  value={(section.style?.maxWidth ?? '1140px') === '100%' ? 'full' : 'boxed'}
                  onChange={(e) => {
                    const mode = e.target.value
                    useBuilderStore.getState().updateSection(section.id, (s) => {
                      if (mode === 'full') {
                        s.style = { ...(s.style ?? {}), maxWidth: '100%' }
                      } else {
                        s.style = { ...(s.style ?? {}), maxWidth: '1140px' }
                      }
                    })
                  }}
                >
                  <option value="boxed">בוקסד</option>
                  <option value="full">רוחב מלא</option>
                </Select>
                <TextInput
                  className="w-28"
                  placeholder="1140px"
                  value={section.style?.maxWidth === '100%' ? '' : (section.style?.maxWidth ?? '1140px')}
                  onChange={(e) => {
                    const val = e.target.value
                    useBuilderStore.getState().updateSection(section.id, (s) => {
                      s.style = { ...(s.style ?? {}), maxWidth: val || undefined }
                    })
                  }}
                />
              </div>
            </Field>
            <Field label="כיוון (Flex Direction)">
              <Select
                value={section.flex?.direction ?? 'column'}
                onChange={(e) => {
                  const val = e.target.value as 'row' | 'column'
                  useBuilderStore.getState().updateSection(section.id, (s) => {
                    s.flex = { ...(s.flex ?? {}), direction: val }
                  })
                }}
              >
                <option value="column">אנכי</option>
                <option value="row">אופקי</option>
              </Select>
            </Field>
            <div className="settings-hr" />
            <Field label="יישור ראשי (Justify)">
              <Select
                value={section.flex?.justify ?? 'start'}
                onChange={(e) => {
                  const val = e.target.value as any
                  useBuilderStore.getState().updateSection(section.id, (s) => {
                    s.flex = { direction: s.flex?.direction ?? 'row', ...(s.flex ?? {}), justify: val }
                  })
                }}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="between">Between</option>
                <option value="around">Around</option>
                <option value="evenly">Evenly</option>
              </Select>
            </Field>
            <Field label="יישור צולב (Align)">
              <Select
                value={section.flex?.align ?? 'stretch'}
                onChange={(e) => {
                  const val = e.target.value as any
                  useBuilderStore.getState().updateSection(section.id, (s) => {
                    s.flex = { direction: s.flex?.direction ?? 'row', ...(s.flex ?? {}), align: val }
                  })
                }}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
                <option value="stretch">Stretch</option>
              </Select>
            </Field>
            <Field label="עטיפה (Wrap)">
              <Select
                value={section.flex?.wrap ?? 'nowrap'}
                onChange={(e) => {
                  const val = e.target.value as 'nowrap' | 'wrap'
                  useBuilderStore.getState().updateSection(section.id, (s) => {
                    s.flex = { direction: s.flex?.direction ?? 'row', ...(s.flex ?? {}), wrap: val }
                  })
                }}
              >
                <option value="nowrap">ללא</option>
                <option value="wrap">עטיפה</option>
              </Select>
            </Field>
            <Field label="ריווח (gap)">
              <NumberInputUI
                value={section.flex?.gap ?? 16}
                onChange={(e) => {
                  const val = Number((e.target as HTMLInputElement).value)
                  useBuilderStore.getState().updateSection(section.id, (s) => {
                    s.flex = { direction: s.flex?.direction ?? 'row', ...(s.flex ?? {}), gap: val }
                  })
                }}
              />
            </Field>
          </div>
        )}

        {tab === 'style' && (
          <div className="space-y-2 settings-group">
            <div className="settings-title">צבעים ומרווחים</div>
            <ColorInput
              label="צבע רקע"
              value={section.style?.background}
              onChange={(v) =>
                useBuilderStore.getState().updateSection(section.id, (s) => {
                  s.style = { ...(s.style ?? {}), background: v }
                })
              }
            />
            <NumberInput
              label="פדינג עליון"
              value={section.style?.padding?.top}
              onChange={(v) => {
                useBuilderStore.getState().updateSection(section.id, (s) => {
                  s.style = { ...(s.style ?? {}), padding: { ...(s.style?.padding ?? {}), top: v } }
                })
              }}
            />
            <NumberInput
              label="פדינג תחתון"
              value={section.style?.padding?.bottom}
              onChange={(v) => {
                useBuilderStore.getState().updateSection(section.id, (s) => {
                  s.style = { ...(s.style ?? {}), padding: { ...(s.style?.padding ?? {}), bottom: v } }
                })
              }}
            />
          </div>
        )}

        {tab === 'advanced' && (
          <div className="space-y-3 settings-group">
            <div className="settings-title">נראות</div>
            <div className="flex gap-3">
              {([
                { device: 'desktop', label: 'דסקטופ' },
                { device: 'tablet', label: 'טאבלט' },
                { device: 'mobile', label: 'מובייל' },
              ] as const).map(({ device, label }) => (
                <button
                  key={device}
                  className={`flex flex-col items-center gap-1 p-2 rounded ${section.advanced?.hiddenOn?.[device] ? 'bg-zinc-200' : 'hover:bg-zinc-100'}`}
                  onClick={() => useBuilderStore.getState().updateSection(section.id, (s) => {
                    const h = { ...(s.advanced?.hiddenOn ?? {}) }
                    h[device] = !h[device]
                    s.advanced = { ...(s.advanced ?? {}), hiddenOn: h }
                  })}
                >
                  {section.advanced?.hiddenOn?.[device] ? <EyeOff size={18} /> : <Eye size={18} />}
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>

            <div className="settings-hr" />
            <Field label="עוגן (ID)">
              <TextInput
                placeholder="my-section"
                value={section.advanced?.anchorId ?? ''}
                onChange={(e) => useBuilderStore.getState().updateSection(section.id, (s) => {
                  s.advanced = { ...(s.advanced ?? {}), anchorId: e.target.value || undefined }
                })}
              />
            </Field>

            <Field label="Z-Index (שכבתיות)">
              <NumberInputUI
                value={section.style?.zIndex ?? '' as any}
                onChange={(e) => useBuilderStore.getState().updateSection(section.id, (s) => {
                  const val = (e.target as HTMLInputElement).value
                  s.style = { ...(s.style ?? {}), zIndex: val === '' ? undefined : Number(val) }
                })}
              />
            </Field>

            <Field label="מיקום (Position)">
              <Select
                value={section.style?.position ?? 'static'}
                onChange={(e) => useBuilderStore.getState().updateSection(section.id, (s) => {
                  s.style = { ...(s.style ?? {}), position: e.target.value as any }
                })}
              >
                <option value="static">סטטי (static)</option>
                <option value="relative">יחסי (relative)</option>
                <option value="absolute">מוחלט (absolute)</option>
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'top', label: 'עליון' },
                { key: 'right', label: 'ימין' },
                { key: 'bottom', label: 'תחתון' },
                { key: 'left', label: 'שמאל' },
              ] as const).map(({ key, label }) => (
                <Field key={key} label={label}>
                  <NumberInputUI
                    value={(section.style as any)?.[key as 'top'] ?? ''}
                    onChange={(e) => useBuilderStore.getState().updateSection(section.id, (s) => {
                      const val = (e.target as HTMLInputElement).value
                      s.style = { ...(s.style ?? {}), [key]: val === '' ? undefined : Number(val) } as any
                    })}
                  />
                </Field>
              ))}
            </div>

            <div className="settings-hr" />
            <div className="grid grid-cols-2 gap-2">
              {([
                { group: 'margin', title: 'שוליים (Margin)' },
                { group: 'padding', title: 'ריווח פנימי (Padding)' },
              ] as const).map(({ group, title }) => (
                <div key={group} className="space-y-1">
                  <div className="text-sm">{title}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'top', label: 'עליון' },
                      { key: 'bottom', label: 'תחתון' },
                      { key: 'left', label: 'שמאל' },
                      { key: 'right', label: 'ימין' },
                    ] as const).map(({ key, label }) => (
                      <Field key={key} label={label}>
                        <NumberInputUI
                          value={(section.style?.[group as 'margin'] as any)?.[key] ?? ''}
                          onChange={(e) => useBuilderStore.getState().updateSection(section.id, (s) => {
                            const val = (e.target as HTMLInputElement).value
                            const current = (s.style?.[group as 'margin'] ?? {}) as any
                            s.style = { ...(s.style ?? {}), [group]: { ...current, [key]: val === '' ? undefined : Number(val) } } as any
                          })}
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <Field label="CSS מותאם">
              <textarea
                className="border rounded px-2 py-1 min-h-[120px] font-mono"
                placeholder=".my-class { color: red }"
                value={section.advanced?.customCss ?? ''}
                onChange={(e) => useBuilderStore.getState().updateSection(section.id, (s) => {
                  s.advanced = { ...(s.advanced ?? {}), customCss: e.target.value || undefined }
                })}
              />
            </Field>
          </div>
        )}
        </div>
      </aside>
    )
  }

  // ווידג'ט
  if (!selectedWidget)
    return (
      <aside className="h-full p-0 overflow-y-auto scrollbar-thin flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <MousePointerSquareDashed size={36} />
            <div className="text-sm">בחרו אלמנט לעריכה</div>
          </div>
        </div>
      </aside>
    )

  return (
    <aside className="h-full p-0 overflow-y-auto scrollbar-thin flex flex-col">
      <div className="px-3 py-2 text-center font-semibold">{selectedWidget ? `עריכת ${labelForWidgetType(selectedWidget.type)}` : ''}</div>
      <div className="border-b" />
      <div>
        <div className="flex border-b">
          <button className={`tab flex-1 h-14 flex flex-col items-center justify-center ${tab === 'general' ? 'tab-active' : ''}`} onClick={() => setTab('general')}>
            <Edit3 size={16} />
            <span>כללי</span>
          </button>
          <button className={`tab flex-1 h-14 flex flex-col items-center justify-center ${tab === 'style' ? 'tab-active' : ''}`} onClick={() => setTab('style')}>
            <Palette size={16} />
            <span>עיצוב</span>
          </button>
          <button className={`tab flex-1 h-14 flex flex-col items-center justify-center ${tab === 'advanced' ? 'tab-active' : ''}`} onClick={() => setTab('advanced')}>
            <Settings2 size={16} />
            <span>מתקדם</span>
          </button>
        </div>
      </div>
      <div className="p-4">

      {/* כללי */}
      {tab === 'general' && selectedWidget.type === 'heading' && (
        <Accordion
          items={[
            {
              id: 'heading-content',
              title: 'כותרת',
              defaultOpen: true,
              children: (
                <div className="space-y-3">
            <Field label="טקסט" icon={<Type size={14} />}>
                    <TextInput
                value={selectedWidget.type === 'heading' ? (selectedWidget.content ?? '') : ''}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'heading') w.content = e.target.value
                        })
                      }
                    />
                  </Field>
                  <Field label="דרגת הכותרת (H)" helper="קובע את תגית ה-HTML" icon={<Type size={14} />}>
                    <Select
                      value={selectedWidget.type === 'heading' ? selectedWidget.tag : 'h2'}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'heading') w.tag = e.target.value as any
                        })
                      }
                    >
                      {(['h1','h2','h3','h4','h5','h6'] as const).map(h => (
                        <option key={h} value={h}>{h.toUpperCase()}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="קישור (לא חובה)" icon={<Link2 size={14} />}>
                    <TextInput
                      placeholder="https://example.com"
                      value={selectedWidget.type === 'heading' ? (selectedWidget.href ?? '') : ''}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'heading') w.href = e.target.value || undefined
                        })
                      }
                    />
                  </Field>
                </div>
              ),
            },
          ]}
        />
      )}

      {tab === 'general' && selectedWidget.type === 'text' && (
        <Accordion
          items={[
            {
              id: 'text-content',
              title: 'טקסט',
              defaultOpen: true,
              children: (
                <div className="space-y-2">
                  <div className="flex items-center gap-1 border rounded p-1 bg-white">
                    <button className="px-2 py-1 hover:bg-zinc-100 rounded" title="מודגש" onClick={() => {
                      const sel = window.getSelection(); if (!sel || sel.rangeCount === 0) return;
                      document.execCommand('bold')
                    }}><Bold size={14} /></button>
                    <button className="px-2 py-1 hover:bg-zinc-100 rounded" title="נטוי" onClick={() => document.execCommand('italic')}><Italic size={14} /></button>
                    <button className="px-2 py-1 hover:bg-zinc-100 rounded" title="קו תחתון" onClick={() => document.execCommand('underline')}><Underline size={14} /></button>
                    <div className="w-px h-5 bg-zinc-200 mx-1" />
                    <button className="px-2 py-1 hover:bg-zinc-100 rounded" title="יישור ימין" onClick={() => document.execCommand('justifyRight')}><AlignRight size={14} /></button>
                    <button className="px-2 py-1 hover:bg-zinc-100 rounded" title="יישור מרכז" onClick={() => document.execCommand('justifyCenter')}><AlignCenter size={14} /></button>
                    <button className="px-2 py-1 hover:bg-zinc-100 rounded" title="יישור שמאל" onClick={() => document.execCommand('justifyLeft')}><AlignLeft size={14} /></button>
                    <div className="w-px h-5 bg-zinc-200 mx-1" />
                    <button className="px-2 py-1 hover:bg-zinc-100 rounded" title="רשימה" onClick={() => document.execCommand('insertUnorderedList')}><List size={14} /></button>
                  </div>
                  <div
                    className="min-h-[112px] rounded-md border px-3 py-2 text-sm bg-white/80 dark:bg-zinc-900/80 focus:outline-none"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'text') w.content = (e.currentTarget as HTMLDivElement).innerHTML })}
                    dangerouslySetInnerHTML={{ __html: selectedWidget.type === 'text' ? (selectedWidget.content ?? '') : '' }}
                  />
                  <div className="text-[11px] text-zinc-500">אפשר לערוך: מודגש, נטוי, קו תחתון, רשימה, יישור, ירידת שורה (Enter)</div>
                </div>
              ),
            },
          ]}
        />
      )}

      {tab === 'general' && selectedWidget.type === 'button' && (
        <Accordion
          items={[
            {
              id: 'button-content',
              title: 'כפתור',
              defaultOpen: true,
              children: (
                <div className="space-y-2">
                  <Field label="תווית" icon={<Type size={14} /> }>
                    <TextInput
                      value={selectedWidget.type === 'button' ? (selectedWidget.label ?? '') : ''}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'button') w.label = e.target.value
                        })
                      }
                    />
                  </Field>
                  <Field label="קישור" icon={<Link2 size={14} /> }>
                    <TextInput
                      value={selectedWidget.type === 'button' ? (selectedWidget.href ?? '') : ''}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'button') w.href = e.target.value || undefined
                        })
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="רוחב">
                      <Select value={(selectedWidget.style?.width === '100%' ? 'full' : 'auto')} onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'button') w.style = { ...(w.style ?? {}), width: e.target.value === 'full' ? '100%' : undefined } })}>
                        <option value="auto">רגיל</option>
                        <option value="full">רוחב מלא</option>
                      </Select>
                    </Field>
                  </div>
                  <div className="settings-group space-y-2">
                    <div className="settings-title">פדינג</div>
                    <div className="grid grid-cols-4 gap-2">
                      {(['top','right','bottom','left'] as const).map((side) => (
                        <Field key={`btn-pad-${side}`} label={{ top: 'עליון', right: 'ימין', bottom: 'תחתון', left: 'שמאל' }[side]}>
                          <NumberInputUI
                            value={selectedWidget.style?.padding?.[side] ?? '' as any}
                            onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'button') w.style = { ...(w.style ?? {}), padding: { ...(w.style?.padding ?? {}), [side]: (e.target as HTMLInputElement).value === '' ? undefined : Number((e.target as HTMLInputElement).value) } } })}
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                </div>
              ),
            },
          ]}
        />
      )}

      {tab === 'general' && selectedWidget.type === 'divider' && (
        <Accordion
          items={[
            {
              id: 'divider-general',
              title: 'קו מפריד',
              defaultOpen: true,
              children: (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="עובי (px)">
                      <NumberInputUI
                        value={selectedWidget.type === 'divider' ? (selectedWidget.style?.borderWidth ?? 1) : 1}
                        onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'divider') w.style = { ...(w.style ?? {}), borderWidth: Number((e.target as HTMLInputElement).value || 0) } })}
                      />
                    </Field>
                    <Field label="סגנון">
                      <Select
                        value={selectedWidget.type === 'divider' ? (selectedWidget.style?.borderStyle ?? 'solid') : 'solid'}
                        onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'divider') w.style = { ...(w.style ?? {}), borderStyle: e.target.value as any } })}
                      >
                        <option value="solid">רגיל</option>
                        <option value="dashed">מקווקו</option>
                        <option value="dotted">מנוקד</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="צבע">
                    <ColorPicker
                      value={selectedWidget.style?.borderColor}
                      onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'divider') w.style = { ...(w.style ?? {}), borderColor: v } })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="מרווח עליון (px)">
                      <NumberInputUI
                        value={selectedWidget.style?.margin?.top as any}
                        onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'divider') w.style = { ...(w.style ?? {}), margin: { ...(w.style?.margin ?? {}), top: Number((e.target as HTMLInputElement).value || 0) } } })}
                      />
                    </Field>
                    <Field label="מרווח תחתון (px)">
                      <NumberInputUI
                        value={selectedWidget.style?.margin?.bottom as any}
                        onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'divider') w.style = { ...(w.style ?? {}), margin: { ...(w.style?.margin ?? {}), bottom: Number((e.target as HTMLInputElement).value || 0) } } })}
                      />
                    </Field>
                  </div>
                </div>
              )
            },
          ]}
        />
      )}

      {tab === 'general' && selectedWidget.type === 'image' && (
        <Accordion
          items={[
            {
              id: 'image-content',
              title: 'תמונה',
              defaultOpen: true,
              children: (
                <div className="space-y-2">
                  <Field label="מקור תמונה (דסקטופ)">
                    <TextInput
                      value={selectedWidget.type === 'image' ? (selectedWidget.src ?? '') : ''}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'image') w.src = e.target.value
                        })
                      }
                    />
                  </Field>
                  <Field label="מקור תמונה (מובייל)">
                    <TextInput
                      placeholder="אם ריק – ישתמש במקור הדסקטופ"
                      value={selectedWidget.type === 'image' ? ((selectedWidget as any).mobileSrc ?? '') : ''}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'image') (w as any).mobileSrc = e.target.value || undefined
                        })
                      }
                    />
                  </Field>
                  <Field label="טקסט חלופי (alt)">
                    <TextInput
                      value={selectedWidget.type === 'image' ? (selectedWidget.alt ?? '') : ''}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'image') (w.alt = e.target.value || undefined)
                        })
                      }
                    />
                  </Field>
                  <Field label="קישור (לא חובה)">
                    <TextInput
                      value={selectedWidget.type === 'image' ? (selectedWidget.linkHref ?? '') : ''}
                      onChange={(e) =>
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'image') (w.linkHref = e.target.value || undefined)
                        })
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="רוחב תמונה">
                      <div className="flex items-center gap-2">
                        <NumberInputUI
                          className="w-20 h-8"
                          value={(() => {
                            const v = selectedWidget.responsiveStyle?.[device]?.width ?? selectedWidget.style?.width
                            if (typeof v === 'string') return Number(String(v).replace(/[^0-9.-]/g,'')) as any
                            return '' as any
                          })()}
                          onChange={(e) => {
                            const raw = (e.target as HTMLInputElement).value
                            const current = selectedWidget.responsiveStyle?.[device]?.width ?? selectedWidget.style?.width
                            const unit = (typeof current === 'string' && current.endsWith('%')) ? '%' : 'px'
                            const num = raw === '' ? undefined : Number(raw)
                            updateWidget(selectedWidget.id, (w) => {
                              const r = { ...(w.responsiveStyle ?? {}) }
                              r[device] = { ...(r[device] ?? {}), width: num === undefined ? undefined : `${num}${unit}` }
                              w.responsiveStyle = r
                            })
                          }}
                        />
                        <Select
                          className="text-xs px-0"
                          value={(() => {
                            const v = selectedWidget.responsiveStyle?.[device]?.width ?? selectedWidget.style?.width
                            if (typeof v === 'string' && v.endsWith('%')) return '%'
                            return 'px'
                          })()}
                          onChange={(e) => {
                            const unit = e.target.value
                            const v = selectedWidget.responsiveStyle?.[device]?.width ?? selectedWidget.style?.width
                            const num = typeof v === 'number' ? v : Number(String(v ?? '0').replace(/[^0-9.-]/g,''))
                            updateWidget(selectedWidget.id, (w) => {
                              const r = { ...(w.responsiveStyle ?? {}) }
                              r[device] = { ...(r[device] ?? {}), width: `${num}${unit}` }
                              w.responsiveStyle = r
                            })
                          }}
                        >
                          <option value="px">px</option>
                          <option value="%">%</option>
                        </Select>
                      </div>
                    </Field>
                    <Field label="התאמת תמונה (Object Fit)">
                      <Select
                        value={selectedWidget.type === 'image' ? (selectedWidget.objectFit ?? 'cover') : 'cover'}
                        onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'image') w.objectFit = e.target.value as any })}
                      >
                        <option value="cover">כיסוי</option>
                        <option value="contain">התאמה</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="גובה תמונה (px)">
                    <NumberInputUI
                      className="w-20 h-8"
                      value={(() => {
                        const h = selectedWidget.type === 'image' ? (selectedWidget.height as any) : undefined
                        if (typeof h === 'number') return h as any
                        if (typeof h === 'string') return Number(String(h).replace(/[^0-9.-]/g,'')) as any
                        return '' as any
                      })()}
                      onChange={(e) => {
                        const raw = (e.target as HTMLInputElement).value
                        const num = raw === '' ? undefined : Number(raw)
                        updateWidget(selectedWidget.id, (w) => { if (w.type === 'image') w.height = num === undefined ? undefined : `${num}px` })
                      }}
                    />
                    <div className="text-[11px] text-zinc-500 mt-1">גובה יעבוד יחד עם "התאמת תמונה" (Cover/Contain)</div>
                  </Field>
                  <Field label="עיגול פינות (px)">
                    <NumberInputUI
                      className="w-20 h-8"
                      value={selectedWidget.style?.borderRadius as any}
                      onChange={(e) => {
                        const val = (e.target as HTMLInputElement).value
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'image') w.style = { ...(w.style ?? {}), borderRadius: val === '' ? undefined : Number(val) }
                        })
                      }}
                    />
                  </Field>
                </div>
              ),
            },
          ]}
        />
      )}

      {tab === 'general' && selectedWidget.type === 'video' && (
        <Accordion
          items={[
            {
              id: 'video-general',
              title: 'וידאו',
              defaultOpen: true,
              children: (
                <div className="space-y-3">
                  <Field label="מקור וידאו (MP4) – דסקטופ">
                    <TextInput
                      placeholder="https://.../video.mp4"
                      value={selectedWidget.type === 'video' ? (selectedWidget.src ?? '') : ''}
                      onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'video') w.src = e.target.value })}
                    />
                  </Field>
                  <Field label="מקור וידאו (MP4) – מובייל">
                    <TextInput
                      placeholder="אם ריק – ישתמש במקור הדסקטופ"
                      value={selectedWidget.type === 'video' ? (((selectedWidget as any).mobileSrc) ?? '') : ''}
                      onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'video') (w as any).mobileSrc = e.target.value || undefined })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="הפעלה אוטומטית">
                      <Checkbox
                        label="Autoplay"
                        checked={selectedWidget.type === 'video' ? !!selectedWidget.autoplay : false}
                        onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'video') w.autoplay = v })}
                      />
                    </Field>
                    <Field label="לולאה">
                      <Checkbox
                        label="Loop"
                        checked={selectedWidget.type === 'video' ? !!selectedWidget.loop : false}
                        onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'video') w.loop = v })}
                      />
                    </Field>
                    <Field label="השתקה">
                      <Checkbox
                        label="Muted"
                        checked={selectedWidget.type === 'video' ? !!selectedWidget.muted : false}
                        onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'video') w.muted = v })}
                      />
                    </Field>
                    <Field label="פקדים מובנים">
                      <Checkbox
                        label="Controls"
                        checked={selectedWidget.type === 'video' ? !!selectedWidget.controls : false}
                        onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'video') w.controls = v })}
                      />
                    </Field>
                  </div>
                </div>
              )
            },
          ]}
        />
      )}

      {tab === 'general' && selectedWidget.type === 'gallery' && (
        <Accordion
          items={[
            {
              id: 'gallery-general',
              title: 'גלריה',
              defaultOpen: true,
              children: (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="עמודות">
                      <NumberInputUI
                        value={selectedWidget.type === 'gallery' ? (selectedWidget.columns ?? 3) : 3}
                        onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'gallery') w.columns = Number((e.target as HTMLInputElement).value || 0) })}
                      />
                    </Field>
                    <Field label="Gap (px)">
                      <NumberInputUI
                        value={selectedWidget.type === 'gallery' ? (selectedWidget.gap ?? 12) : 12}
                        onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'gallery') w.gap = Number((e.target as HTMLInputElement).value || 0) })}
                      />
                    </Field>
                  </div>
                  <div className="settings-hr" />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-600">תמונות</div>
                    <button className="btn btn-ghost" onClick={() => updateWidget(selectedWidget.id, (w) => { if (w.type === 'gallery') w.images = [ ...(w.images ?? []), { id: String(Date.now()), src: 'https://picsum.photos/400/300' } as any ] })}>הוסף תמונה</button>
                  </div>
                  <div className="space-y-2">
                    {((selectedWidget.type === 'gallery' ? (selectedWidget.images ?? []) : []) as any[]).map((img, idx) => (
                      <div key={idx} className="border rounded p-2 flex items-start gap-2">
                        <img src={img.src} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1 space-y-2">
                          <TextInput
                            placeholder="כתובת תמונה (URL)"
                            value={img.src}
                            onChange={(e) => updateWidget(selectedWidget.id, (w) => {
                              if (w.type === 'gallery') {
                                const arr = [...(w.images ?? [])]
                                arr[idx] = { ...(arr[idx] ?? {}), src: e.target.value }
                                w.images = arr as any
                              }
                            })}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <TextInput
                              placeholder="טקסט חלופי (Alt)"
                              value={img.alt ?? ''}
                              onChange={(e) => updateWidget(selectedWidget.id, (w) => {
                                if (w.type === 'gallery') {
                                  const arr = [...(w.images ?? [])]
                                  arr[idx] = { ...(arr[idx] ?? {}), alt: e.target.value || undefined }
                                  w.images = arr as any
                                }
                              })}
                            />
                            <TextInput
                              placeholder="קישור (לא חובה)"
                              value={img.linkHref ?? ''}
                              onChange={(e) => updateWidget(selectedWidget.id, (w) => {
                                if (w.type === 'gallery') {
                                  const arr = [...(w.images ?? [])]
                                  arr[idx] = { ...(arr[idx] ?? {}), linkHref: e.target.value || undefined }
                                  w.images = arr as any
                                }
                              })}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button className="btn btn-ghost" onClick={() => updateWidget(selectedWidget.id, (w) => { if (w.type === 'gallery') { const arr = [ ...(w.images ?? []) ]; if (idx > 0) { const tmp = arr[idx-1]; arr[idx-1] = arr[idx]; arr[idx] = tmp; } w.images = arr as any } })}>מעלה</button>
                            <button className="btn btn-ghost" onClick={() => updateWidget(selectedWidget.id, (w) => { if (w.type === 'gallery') { const arr = [ ...(w.images ?? []) ]; if (idx < arr.length-1) { const tmp = arr[idx+1]; arr[idx+1] = arr[idx]; arr[idx] = tmp; } w.images = arr as any } })}>מוריד</button>
                            <button className="btn btn-ghost" onClick={() => updateWidget(selectedWidget.id, (w) => { if (w.type === 'gallery') { const arr = [...(w.images ?? [])]; arr.splice(idx,0, { ...(arr[idx] ?? {}), id: String(Date.now()) }); w.images = arr as any } })}>שכפל</button>
                            <button className="btn btn-ghost" onClick={() => updateWidget(selectedWidget.id, (w) => { if (w.type === 'gallery') { const arr = [...(w.images ?? [])]; arr.splice(idx,1); w.images = arr as any } })}>מחק</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          ]}
        />
      )}

      {tab === 'general' && selectedWidget.type === 'spacer' && (
        <Accordion
          items={[
            {
              id: 'spacer-general',
              title: 'ריווח',
              defaultOpen: true,
              children: (
                <div className="space-y-2">
                  <Field label="גובה (Height)">
                    <div className="flex items-center gap-2">
                      <NumberInputUI
                        className="w-20 h-8"
                        value={(() => {
                          const h = selectedWidget.height as any
                          if (typeof h === 'string') return Number(String(h).replace(/[^0-9.-]/g,'')) as any
                          return (h ?? 0) as any
                        })()}
                        onChange={(e) => {
                          const raw = (e.target as HTMLInputElement).value
                          const prev = selectedWidget.height
                          const unit = typeof prev === 'string' && String(prev).endsWith('vh') ? 'vh' : 'px'
                          const num = raw === '' ? undefined : Number(raw)
                          updateWidget(selectedWidget.id, (w) => { if (w.type === 'spacer') w.height = num === undefined ? 0 : `${num}${unit}` })
                        }}
                      />
                      <Select
                        className="text-xs px-0"
                        value={typeof selectedWidget.height === 'string' && String(selectedWidget.height).endsWith('vh') ? 'vh' : 'px'}
                        onChange={(e) => {
                          const unit = e.target.value
                          const prev = selectedWidget.height
                          const num = typeof prev === 'number' ? prev : Number(String(prev ?? '0').replace(/[^0-9.-]/g,''))
                          updateWidget(selectedWidget.id, (w) => { if (w.type === 'spacer') w.height = `${num}${unit}` })
                        }}
                      >
                        <option value="px">px</option>
                        <option value="vh">vh</option>
                      </Select>
                    </div>
                  </Field>
                </div>
              ),
            },
          ]}
        />
      )}

      {tab === 'general' && selectedWidget.type === 'banner' && (
        <Accordion
          items={[
            {
              id: 'banner-content-text',
              title: 'תוכן',
              defaultOpen: true,
              children: (
                <div className="space-y-3">
                  <Field label="כותרת">
                    <TextInput
                      value={selectedWidget.heading ?? ''}
                      placeholder="כותרת הבאנר"
                      onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.heading = e.target.value || undefined })}
                    />
                  </Field>
                  <Field label="תוכן">
                    <TextInput
                      value={selectedWidget.text ?? ''}
                      placeholder="טקסט הבאנר"
                      onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.text = e.target.value || undefined })}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-2">
                    <Field label="כפתור - תווית">
                      <TextInput
                        value={selectedWidget.ctaLabel ?? ''}
                        placeholder="טקסט הכפתור"
                        onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.ctaLabel = e.target.value || undefined })}
                      />
                    </Field>
                    <Field label="כפתור - קישור">
                      <TextInput
                        value={selectedWidget.ctaHref ?? ''}
                        placeholder="https://..."
                        onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.ctaHref = e.target.value || undefined })}
                      />
                    </Field>
                  </div>
                </div>
              )
            },
            {
              id: 'banner-size',
              title: 'גובה',
              children: (
                <div className="space-y-3">
                  <Field label="גובה באנר – דסקטופ">
                    <div className="flex items-center gap-2">
                      <NumberInputUI
                        className="w-20 h-8"
                        value={(() => {
                          const h = selectedWidget.style?.minHeight as any
                          if (typeof h === 'string') return Number(String(h).replace(/[^0-9.-]/g,'')) as any
                          return (h ?? '') as any
                        })()}
                        onChange={(e) => {
                          const raw = (e.target as HTMLInputElement).value
                          const prev = selectedWidget.style?.minHeight
                          const unit = typeof prev === 'string' && String(prev).endsWith('vh') ? 'vh' : 'px'
                          const num = raw === '' ? undefined : Number(raw)
                          updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.style = { ...(w.style ?? {}), minHeight: num === undefined ? undefined : `${num}${unit}` } })
                        }}
                      />
                      <Select
                        className="text-xs px-0"
                        value={typeof selectedWidget.style?.minHeight === 'string' && String(selectedWidget.style?.minHeight).endsWith('vh') ? 'vh' : 'px'}
                        onChange={(e) => {
                          const unit = e.target.value
                          const prev = selectedWidget.style?.minHeight
                          const num = typeof prev === 'number' ? prev : Number(String(prev ?? '0').replace(/[^0-9.-]/g,''))
                          updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.style = { ...(w.style ?? {}), minHeight: `${num}${unit}` } })
                        }}
                      >
                        <option value="px">px</option>
                        <option value="vh">vh</option>
                      </Select>
                    </div>
                  </Field>
                  <Field label="גובה באנר – מובייל">
                    <div className="flex items-center gap-2">
                      <NumberInputUI
                        className="w-20 h-8"
                        value={(() => {
                          const h = selectedWidget.responsiveStyle?.mobile?.minHeight as any
                          if (typeof h === 'string') return Number(String(h).replace(/[^0-9.-]/g,'')) as any
                          return (h ?? '') as any
                        })()}
                        onChange={(e) => {
                          const raw = (e.target as HTMLInputElement).value
                          const current = selectedWidget.responsiveStyle?.mobile?.minHeight
                          // יחידה ברירת מחדל לפי ערך קיים במובייל, אחרת לפי דסקטופ
                          const base = current ?? selectedWidget.style?.minHeight
                          const unit = typeof base === 'string' && String(base).endsWith('vh') ? 'vh' : 'px'
                          const num = raw === '' ? undefined : Number(raw)
                          updateWidget(selectedWidget.id, (w) => {
                            if (w.type === 'banner') {
                              const r = { ...(w.responsiveStyle ?? {}) }
                              r.mobile = { ...(r.mobile ?? {}), minHeight: num === undefined ? undefined : `${num}${unit}` } as any
                              w.responsiveStyle = r
                            }
                          })
                        }}
                      />
                      <Select
                        className="text-xs px-0"
                        value={(() => {
                          const v = selectedWidget.responsiveStyle?.mobile?.minHeight ?? selectedWidget.style?.minHeight
                          return (typeof v === 'string' && String(v).endsWith('vh')) ? 'vh' : 'px'
                        })()}
                        onChange={(e) => {
                          const unit = e.target.value
                          const base = selectedWidget.responsiveStyle?.mobile?.minHeight ?? selectedWidget.style?.minHeight
                          const num = typeof base === 'number' ? base : Number(String(base ?? '0').replace(/[^0-9.-]/g,''))
                          updateWidget(selectedWidget.id, (w) => {
                            if (w.type === 'banner') {
                              const r = { ...(w.responsiveStyle ?? {}) }
                              r.mobile = { ...(r.mobile ?? {}), minHeight: `${num}${unit}` } as any
                              w.responsiveStyle = r
                            }
                          })
                        }}
                      >
                        <option value="px">px</option>
                        <option value="vh">vh</option>
                      </Select>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">אם ריק – ישתמש בגובה הדסקטופ</div>
                  </Field>
                </div>
              )
            },
            {
              id: 'banner-position',
              title: 'מיקום',
              children: (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="יישור אופקי">
                    <Select
                      value={selectedWidget.contentPosition?.horizontal ?? 'center'}
                      onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.contentPosition = { ...(w.contentPosition ?? { vertical: 'center', horizontal: 'center' }), horizontal: e.target.value as any } })}
                    >
                      <option value="start">שמאל</option>
                      <option value="center">מרכז</option>
                      <option value="end">ימין</option>
                    </Select>
                  </Field>
                  <Field label="יישור אנכי">
                    <Select
                      value={selectedWidget.contentPosition?.vertical ?? 'center'}
                      onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.contentPosition = { ...(w.contentPosition ?? { vertical: 'center', horizontal: 'center' }), vertical: e.target.value as any } })}
                    >
                      <option value="start">למעלה</option>
                      <option value="center">מרכז</option>
                      <option value="end">למטה</option>
                    </Select>
                  </Field>
                </div>
              )
            },
            {
              id: 'banner-media',
              title: 'מדיה',
              children: (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-600">תמונת רקע (דסקטופ)</div>
                    <div
                      className="border border-dashed rounded-lg p-4 text-sm text-zinc-500 hover:bg-zinc-50 cursor-pointer flex items-center justify-center gap-2"
                      onClick={() => setMediaModal({ kind: 'image', widgetId: selectedWidget.id })}
                    >
                      <span>לחצו לבחירה / גררו תמונה להעלאה</span>
                    </div>
                    {selectedWidget.type === 'banner' && selectedWidget.backgroundImage && (
                      <div className="text-xs text-zinc-500 break-all">נוכחית: {selectedWidget.backgroundImage}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-600">תמונת רקע (מובייל)</div>
                    <TextInput
                      placeholder="אם ריק – ישתמש בתמונת הדסקטופ"
                      value={selectedWidget.type === 'banner' ? ((selectedWidget as any).backgroundImageMobile ?? '') : ''}
                      onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') (w as any).backgroundImageMobile = e.target.value || undefined })}
                    />
                  </div>
                  <Field label="וידאו (MP4) – דסקטופ">
                    <TextInput
                      placeholder="https://.../video.mp4"
                      value={selectedWidget.type === 'banner' ? (selectedWidget.backgroundVideoUrl ?? '') : ''}
                      onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.backgroundVideoUrl = e.target.value || undefined })}
                    />
                  </Field>
                  <Field label="וידאו (MP4) – מובייל">
                    <TextInput
                      placeholder="אם ריק – ישתמש בוידאו הדסקטופ"
                      value={selectedWidget.type === 'banner' ? (((selectedWidget as any).backgroundVideoUrlMobile) ?? '') : ''}
                      onChange={(e) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') (w as any).backgroundVideoUrlMobile = e.target.value || undefined })}
                    />
                  </Field>
                  <div className="text-xs text-zinc-500">אם מולא וידאו, הוא יוצג במקום תמונת הרקע.</div>
                </div>
              )
            },
          ]}
        />
      )}

      {tab === 'general' && selectedWidget.type === 'container' && (
        <Accordion
          items={[
            {
              id: 'columns-general',
              title: 'עמודות',
              defaultOpen: true,
              children: (
                <div className="space-y-3">
                  <Field label="מספר עמודות">
                    <NumberInputUI
                      value={selectedWidget.columns ?? 2}
                      onChange={(e) => {
                        const val = Number((e.target as HTMLInputElement).value || 0)
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'container') {
                            const next = Math.max(1, Math.min(6, val || 1))
                            // עדכון כמות העמודות ושמירת ילדים קיימים
                            const prevCols = w.columns ?? 2
                            const prevChildren = (w as any).columnsChildren ?? Array.from({ length: prevCols }, () => [])
                            const newChildren = Array.from({ length: next }, (_, i) => prevChildren[i] ?? [])
                            w.columns = next
                            ;(w as any).columnsChildren = newChildren
                          }
                        })
                      }}
                    />
                  </Field>
                  <Field label="Gap בין העמודות (px)">
                    <NumberInputUI
                      value={selectedWidget.flex?.gap ?? 16}
                      onChange={(e) => {
                        const val = Number((e.target as HTMLInputElement).value)
                        updateWidget(selectedWidget.id, (w) => {
                          if (w.type === 'container') {
                            w.flex = { ...(w.flex ?? { direction: 'row' }), gap: val }
                          }
                        })
                      }}
                    />
                  </Field>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="עמודות - דסקטופ">
                      <NumberInputUI
                        value={selectedWidget.responsiveColumns?.desktop ?? selectedWidget.columns ?? 2}
                        onChange={(e) => {
                          const num = Number((e.target as HTMLInputElement).value || 0)
                          updateWidget(selectedWidget.id, (w) => { if (w.type === 'container') { w.responsiveColumns = { ...(w.responsiveColumns ?? {}), desktop: num } } })
                        }}
                      />
                    </Field>
                    <Field label="עמודות - טאבלט">
                      <NumberInputUI
                        value={selectedWidget.responsiveColumns?.tablet ?? '' as any}
                        onChange={(e) => {
                          const num = Number((e.target as HTMLInputElement).value || 0)
                          updateWidget(selectedWidget.id, (w) => { if (w.type === 'container') { w.responsiveColumns = { ...(w.responsiveColumns ?? {}), tablet: num } } })
                        }}
                      />
                    </Field>
                    <Field label="עמודות - מובייל">
                      <NumberInputUI
                        value={selectedWidget.responsiveColumns?.mobile ?? 1 as any}
                        onChange={(e) => {
                          const num = Number((e.target as HTMLInputElement).value || 0)
                          updateWidget(selectedWidget.id, (w) => { if (w.type === 'container') { w.responsiveColumns = { ...(w.responsiveColumns ?? {}), mobile: num } } })
                        }}
                      />
                    </Field>
                  </div>
                </div>
              )
            },
          ]}
        />
      )}

      {/* עיצוב ווידג'ט */}
      {tab === 'style' && selectedWidget.type !== 'banner' && (
        <StyleControls
          widget={selectedWidget}
          device={device}
          onUpdate={(fn) => updateWidget(selectedWidget.id, fn)}
        />
      )}

      {tab === 'style' && selectedWidget.type === 'banner' && (
        <Accordion
          items={[
            {
              id: 'banner-style-base',
              title: 'עיצוב כללי',
              defaultOpen: true,
              children: (
                <StyleControls
                  widget={selectedWidget}
                  device={device}
                  onUpdate={(fn) => updateWidget(selectedWidget.id, fn)}
                />
              )
            },
            {
              id: 'banner-style-typography',
              title: 'טיפוגרפיה',
              children: (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <NumberInput label="H גודל" value={selectedWidget.headingStyle?.fontSize as any} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.headingStyle = { ...(w.headingStyle ?? {}), fontSize: v } })} />
                    <NumberInput label="H משקל" value={selectedWidget.headingStyle?.fontWeight as any} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.headingStyle = { ...(w.headingStyle ?? {}), fontWeight: v } })} />
                    <NumberInput label="H גובה שורה" value={selectedWidget.headingStyle?.lineHeight as any} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.headingStyle = { ...(w.headingStyle ?? {}), lineHeight: v } })} />
                    <ColorInput label="H צבע" value={selectedWidget.headingStyle?.color} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.headingStyle = { ...(w.headingStyle ?? {}), color: v } })} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <NumberInput label="טקסט גודל" value={selectedWidget.textStyle?.fontSize as any} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.textStyle = { ...(w.textStyle ?? {}), fontSize: v } })} />
                    <NumberInput label="טקסט משקל" value={selectedWidget.textStyle?.fontWeight as any} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.textStyle = { ...(w.textStyle ?? {}), fontWeight: v } })} />
                    <NumberInput label="טקסט גובה שורה" value={selectedWidget.textStyle?.lineHeight as any} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.textStyle = { ...(w.textStyle ?? {}), lineHeight: v } })} />
                    <ColorInput label="טקסט צבע" value={selectedWidget.textStyle?.color} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.textStyle = { ...(w.textStyle ?? {}), color: v } })} />
                  </div>
                </div>
              )
            },
            {
              id: 'banner-style-colors',
              title: 'צבעים וכפתור',
              children: (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ColorInput label="Overlay (החשכה)" value={selectedWidget.overlayColor} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.overlayColor = v })} />
                    <NumberInput label="שקיפות (0-1)" value={Number(String(selectedWidget.overlayColor?.match(/rgba\(0,0,0,(.*)\)/)?.[1] ?? '0.6'))}
                      onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') { const alpha = typeof v === 'number' ? v : 0.6; w.overlayColor = `rgba(0,0,0,${alpha})` } })} />
                  </div>
                  <ColorInput label="כפתור רקע" value={selectedWidget.buttonStyle?.background} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.buttonStyle = { ...(w.buttonStyle ?? {}), background: v } })} />
                  <ColorInput label="כפתור טקסט" value={selectedWidget.buttonStyle?.color} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.buttonStyle = { ...(w.buttonStyle ?? {}), color: v } })} />
                  <ColorInput label="Hover רקע" value={selectedWidget.buttonHoverStyle?.background} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.buttonHoverStyle = { ...(w.buttonHoverStyle ?? {}), background: v } })} />
                  <ColorInput label="Hover טקסט" value={selectedWidget.buttonHoverStyle?.color} onChange={(v) => updateWidget(selectedWidget.id, (w) => { if (w.type === 'banner') w.buttonHoverStyle = { ...(w.buttonHoverStyle ?? {}), color: v } })} />
                </div>
              )
            }
          ]}
        />
      )}

      {/* מתקדם */}
      {tab === 'advanced' && selectedWidget && (
        <div className="space-y-3 settings-group">
          <div className="settings-title">מתקדם</div>
          <label className="text-sm grid grid-cols-1 gap-1">
            עוגן (ID)
            <input
              className="border rounded px-2 py-1"
              value={selectedWidget.advanced?.anchorId ?? ''}
              onChange={(e) =>
                updateWidget(selectedWidget.id, (w) => {
                  w.advanced = { ...(w.advanced ?? {}), anchorId: e.target.value || undefined }
                })
              }
            />
          </label>
          <div className="text-sm">
            נראות:
            <div className="mt-1 flex gap-4">
              {([
                { key: 'desktop', label: 'דסקטופ' },
                { key: 'tablet', label: 'טאבלט' },
                { key: 'mobile', label: 'מובייל' },
              ] as const).map(({ key, label }) => {
                const isHidden = !!selectedWidget.advanced?.hiddenOn?.[key]
                return (
                  <button
                    key={key}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 ${isHidden ? 'text-zinc-500' : 'text-zinc-900'}`}
                    onClick={() =>
                      updateWidget(selectedWidget.id, (w) => {
                        const h = { ...(w.advanced?.hiddenOn ?? {}) } as any
                        h[key] = !isHidden
                        w.advanced = { ...(w.advanced ?? {}), hiddenOn: h }
                      })
                    }
                    title={`${isHidden ? 'מוצג' : 'מוסתר'} ב${label}`}
                  >
                    {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="Z-Index" value={selectedWidget.style?.zIndex} onChange={(v) => updateWidget(selectedWidget.id, (w) => { w.style = { ...(w.style ?? {}), zIndex: v } })} />
            <Field label="Position">
              <Select
                value={selectedWidget.style?.position ?? 'static'}
                onChange={(e) => updateWidget(selectedWidget.id, (w) => { w.style = { ...(w.style ?? {}), position: e.target.value as any } })}
              >
                <option value="static">Static</option>
                <option value="relative">Relative</option>
                <option value="absolute">Absolute</option>
              </Select>
            </Field>
          </div>
          <div className="space-y-2 mt-2">
            <div className="text-sm font-medium">היסטים (Offsets)</div>
            <div className="grid grid-cols-4 gap-2">
              {([
                { key: 'top', label: 'עליון' },
                { key: 'bottom', label: 'תחתון' },
                { key: 'right', label: 'ימין' },
                { key: 'left', label: 'שמאל' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="text-center">
                  <input
                    type="number"
                    className="w-16 h-8 rounded border px-1 text-xs"
                    value={(selectedWidget.style as any)?.[key] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Number(e.target.value)
                      updateWidget(selectedWidget.id, (w) => {
                        (w.style as any) = { ...(w.style ?? {}), [key]: v }
                      })
                    }}
                  />
                  <div className="text-[10px] text-zinc-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <div className="text-sm font-medium">מרגין</div>
            <div className="grid grid-cols-4 gap-2">
              {([
                { key: 'top', label: 'עליון' },
                { key: 'bottom', label: 'תחתון' },
                { key: 'right', label: 'ימין' },
                { key: 'left', label: 'שמאל' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="text-center">
                  <input
                    type="number"
                    className="w-16 h-8 rounded border px-1 text-xs"
                    value={(selectedWidget.style?.margin as any)?.[key] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Number(e.target.value)
                      updateWidget(selectedWidget.id, (w) => {
                        w.style = { ...(w.style ?? {}), margin: { ...(w.style?.margin ?? {}), [key]: v } }
                      })
                    }}
                  />
                  <div className="text-[10px] text-zinc-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <div className="text-sm font-medium">פדינג</div>
            <div className="grid grid-cols-4 gap-2">
              {([
                { key: 'top', label: 'עליון' },
                { key: 'bottom', label: 'תחתון' },
                { key: 'right', label: 'ימין' },
                { key: 'left', label: 'שמאל' },
              ] as const).map(({ key, label }) => (
                <div key={key} className="text-center">
                  <input
                    type="number"
                    className="w-16 h-8 rounded border px-1 text-xs"
                    value={(selectedWidget.style?.padding as any)?.[key] ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Number(e.target.value)
                      updateWidget(selectedWidget.id, (w) => {
                        w.style = { ...(w.style ?? {}), padding: { ...(w.style?.padding ?? {}), [key]: v } }
                      })
                    }}
                  />
                  <div className="text-[10px] text-zinc-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <label className="text-sm grid grid-cols-1 gap-1 mt-3">
            CSS מותאם
            <textarea
              className="border rounded px-2 py-1 min-h-[120px] font-mono"
              placeholder=".my-class { color: red }"
              value={selectedWidget.advanced?.customCss ?? ''}
              onChange={(e) =>
                updateWidget(selectedWidget.id, (w) => {
                  w.advanced = { ...(w.advanced ?? {}), customCss: e.target.value || undefined }
                })
              }
            />
          </label>
        </div>
      )}

      {mediaModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setMediaModal(null)}>
          <div className="bg-white rounded-xl shadow-xl border w-[620px] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold mb-3">ספריית מדיה · {mediaModal.kind === 'image' ? 'תמונות' : 'וידאו (MP4)'} </div>
            <div
              className="mb-4 border-2 border-dashed rounded-xl p-8 text-center text-sm text-zinc-600 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
              onDragOver={(e) => { e.preventDefault() }}
              onDrop={(e) => {
                e.preventDefault()
                const file = e.dataTransfer.files?.[0]
                if (!file) return
                const url = URL.createObjectURL(file)
                setAssets((prev) => [{ kind: mediaModal.kind, url }, ...prev])
                updateWidget(mediaModal.widgetId, (w) => {
                  if (w.type === 'banner') {
                    if (mediaModal.kind === 'image') w.backgroundImage = url
                    else w.backgroundVideoUrl = url
                  }
                })
                setMediaModal(null)
              }}
              onClick={(e) => {
                const input = (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement | null)
                input?.click()
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center text-[var(--qs-outline-strong)]">
                  <UploadCloud size={22} />
                </div>
                <div className="text-sm font-medium">גררו לכאן להעלאה או לחצו לבחירת קובץ</div>
                <div className="text-[11px] text-zinc-500">{mediaModal.kind === 'image' ? 'תמונות (JPG, PNG, WEBP)' : 'וידאו MP4'}</div>
                <input
                  type="file"
                  className="hidden"
                  accept={mediaModal.kind === 'image' ? 'image/*' : 'video/mp4'}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = URL.createObjectURL(file)
                    setAssets((prev) => [{ kind: mediaModal.kind, url }, ...prev])
                    updateWidget(mediaModal.widgetId, (w) => {
                      if (w.type === 'banner') {
                        if (mediaModal.kind === 'image') w.backgroundImage = url
                        else w.backgroundVideoUrl = url
                      }
                    })
                    setMediaModal(null)
                  }}
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto grid grid-cols-3 gap-2">
              {assets.filter(a => a.kind === mediaModal.kind).map((a, idx) => (
                <button key={idx} className="border rounded p-1 hover:ring" onClick={() => {
                  updateWidget(mediaModal.widgetId, (w) => {
                    if (w.type === 'banner') {
                      if (mediaModal.kind === 'image') w.backgroundImage = a.url
                      else w.backgroundVideoUrl = a.url
                    }
                  })
                  setMediaModal(null)
                }}>
                  {mediaModal.kind === 'image' ? (
                    <img src={a.url} className="w-full h-20 object-cover rounded" />
                  ) : (
                    <video src={a.url} className="w-full h-20 object-cover rounded" />
                  )}
                </button>
              ))}
              {assets.filter(a => a.kind === mediaModal.kind).length === 0 && (
                <div className="col-span-3 text-sm text-zinc-500 text-center py-6">אין קבצים שמורים עדיין</div>
              )}
            </div>
            <div className="mt-4 text-right">
              <button className="btn btn-ghost" onClick={() => setMediaModal(null)}>סגור</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </aside>
  )
}