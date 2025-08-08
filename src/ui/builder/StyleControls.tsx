import { Accordion } from '@/ui/controls/Accordion'
import { Field, NumberInputUI, ColorPicker, Select } from '@/ui/controls/Controls'
import type { DeviceBreakpoint, Widget } from '@/types/builder'
import { Palette, Type as TypeIcon, MoveVertical, MoveHorizontal, Circle, ArrowUp, ArrowRight, ArrowDown, ArrowLeft } from 'lucide-react'

function ColorInput({ label, value, onChange, icon }: { label: string; value?: string; onChange: (v?: string) => void; icon?: React.ReactNode }) {
  return (
    <Field label={label} icon={icon}>
      <ColorPicker value={value} onChange={onChange} />
    </Field>
  )
}

function NumberInput({ label, value, onChange, icon }: { label: string; value?: number; onChange: (v?: number) => void; icon?: React.ReactNode }) {
  return (
    <Field label={label} icon={icon}>
      <NumberInputUI className="w-16 h-8" value={value ?? '' as any} onChange={(e) => onChange((e.target as HTMLInputElement).value === '' ? undefined : Number((e.target as HTMLInputElement).value))} />
    </Field>
  )
}

export function StyleControls({ widget, device, onUpdate }: { widget: Widget; device: DeviceBreakpoint; onUpdate: (fn: (w: Widget) => void) => void }) {
  const style = widget.style ?? {}
  const responsive = widget.responsiveStyle?.[device] ?? {}

  const updateResponsive = (key: keyof typeof responsive, value: any) => {
    onUpdate((w) => {
      const r = { ...(w.responsiveStyle ?? {}) }
      r[device] = { ...(r[device] ?? {}), [key]: value } as any
      w.responsiveStyle = r
    })
  }

  const updateStyle = (key: keyof typeof style, value: any) => {
    onUpdate((w) => {
      w.style = { ...(w.style ?? {}), [key]: value } as any
    })
  }

  const current = { ...style, ...responsive }

  return (
    <Accordion
      items={[
        {
          id: 'style-colors-typography',
          title: 'צבעים וטיפוגרפיה',
          defaultOpen: true,
          children: (
            <div className="space-y-3 settings-group">
              <div className="grid grid-cols-1 gap-2">
                <ColorInput
                  label="צבע רקע"
                  icon={<Palette size={14} />}
                  value={(responsive.background ?? style.background ?? 'rgba(0,0,0,0)') as any}
                  onChange={(v) => updateResponsive('background', v)}
                />
                <ColorInput
                  label="צבע טקסט"
                  icon={<TypeIcon size={14} />}
                  value={(responsive.color ?? style.color ?? '#000000') as any}
                  onChange={(v) => updateResponsive('color', v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="יישור טקסט">
                  <Select value={(responsive.textAlign ?? style.textAlign ?? 'right') as any} onChange={(e) => updateResponsive('textAlign', e.target.value as any)}>
                    <option value="right">ימין</option>
                    <option value="center">מרכז</option>
                    <option value="left">שמאל</option>
                  </Select>
                </Field>
                <Field label="משקל">
                  <Select value={(responsive.fontWeight ?? style.fontWeight ?? 400) as any} onChange={(e) => updateResponsive('fontWeight', Number(e.target.value))}>
                    {[100,200,300,400,500,600,700,800,900].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="פונט (Google)">
                  <Select value={(responsive.fontFamily ?? style.fontFamily ?? 'Noto Sans Hebrew') as any} onChange={(e) => updateResponsive('fontFamily', e.target.value)}>
                    {['Noto Sans Hebrew','Heebo','Varela Round','Rubik','Assistant','Alef','Arimo','Secular One','Open Sans','Roboto','Inter','Poppins','Montserrat'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <NumberInput label="גודל טקסט" icon={<TypeIcon size={14} />} value={(responsive.fontSize ?? style.fontSize) as any} onChange={(v) => updateResponsive('fontSize', v)} />
                <NumberInput label="גובה שורה" icon={<MoveVertical size={14} />} value={(responsive.lineHeight ?? style.lineHeight) as any} onChange={(v) => updateResponsive('lineHeight', v)} />
                <NumberInput label="מרווח אותיות" icon={<MoveHorizontal size={14} />} value={(responsive.letterSpacing ?? style.letterSpacing) as any} onChange={(v) => updateResponsive('letterSpacing', v)} />
              </div>
            </div>
          )
        },
        {
          id: 'style-spacing',
          title: 'מרווחים (px)',
          children: (
            <div className="space-y-3 settings-group">
              <div className="settings-subtitle text-[13px]">ריפוד פנימי</div>
              <div className="grid grid-cols-2 gap-2">
                  {(['top','right','bottom','left'] as const).map((side) => (
                  <Field
                    key={`padding-${side}`}
                    label={{ top: 'עליון', right: 'ימין', bottom: 'תחתון', left: 'שמאל' }[side]}
                    icon={{ top: <ArrowUp size={12} />, right: <ArrowRight size={12} />, bottom: <ArrowDown size={12} />, left: <ArrowLeft size={12} /> }[side]}
                  >
                    <div className="flex items-center gap-1">
                      <NumberInputUI
                        className="w-20 h-8"
                        value={(() => {
                          const v = current.padding?.[side]
                          if (typeof v === 'string') return Number(String(v).replace(/[^0-9.-]/g,'')) as any
                          // אם אין ערך רספונסיבי, נרמז מערכי ברירת מחדל בגלובל
                          const base = (widget.style?.padding as any)?.[side]
                          if (typeof base === 'string') return Number(String(base).replace(/[^0-9.-]/g,'')) as any
                          if (typeof base === 'number') return base as any
                          // ברירת מחדל חכמה: לטקסט נציג 12 אם אין ערך
                          if (widget.type === 'text') return 12 as any
                          return (v ?? 0) as any
                        })()}
                        onChange={(e) => {
                          const raw = (e.target as HTMLInputElement).value
                          const unit = (current.padding?.[side] && typeof current.padding?.[side] === 'string' && /%|rem|px$/.test(String(current.padding?.[side])))
                            ? String(current.padding?.[side]).replace(/^[0-9. -]+/,'') : 'px'
                          const num = raw === '' ? undefined : Number(raw)
                          updateResponsive('padding', { ...(current.padding ?? {}), [side]: num === undefined ? undefined : `${num}${unit}` })
                        }}
                      />
                      <Select className="text-xs px-0" value={(() => {
                        const v = current.padding?.[side] ?? (widget.style?.padding as any)?.[side]
                        if (typeof v === 'string' && v.endsWith('rem')) return 'rem'
                        if (typeof v === 'string' && v.endsWith('%')) return '%'
                        if (typeof v === 'number') return 'px'
                        if (widget.type === 'text') return 'px'
                        return 'px'
                      })()} onChange={(e) => {
                        const unit = e.target.value
                        const v = current.padding?.[side]
                        const num = typeof v === 'number' ? v : Number(String(v ?? '0').replace(/[^0-9.-]/g,''))
                        updateResponsive('padding', { ...(current.padding ?? {}), [side]: `${num}${unit}` })
                      }}>
                        <option value="px">px</option>
                        <option value="rem">rem</option>
                        <option value="%">%</option>
                      </Select>
                    </div>
                  </Field>
                ))}
              </div>
              <div className="settings-subtitle text-[13px]">שוליים</div>
              <div className="grid grid-cols-2 gap-1">
                  {(['top','right','bottom','left'] as const).map((side) => (
                  <Field
                    key={`margin-${side}`}
                    label={{ top: 'עליון', right: 'ימין', bottom: 'תחתון', left: 'שמאל' }[side]}
                    icon={{ top: <ArrowUp size={12} />, right: <ArrowRight size={12} />, bottom: <ArrowDown size={12} />, left: <ArrowLeft size={12} /> }[side]}
                  >
                    <div className="flex items-center gap-1">
                      <NumberInputUI
                        className="w-20 h-8"
                        value={(() => {
                          const v = current.margin?.[side]
                          if (typeof v === 'string') return Number(String(v).replace(/[^0-9.-]/g,'')) as any
                          return (v ?? 0) as any
                        })()}
                        onChange={(e) => {
                          const raw = (e.target as HTMLInputElement).value
                          const unit = (current.margin?.[side] && typeof current.margin?.[side] === 'string' && /%|rem|px$/.test(String(current.margin?.[side])))
                            ? String(current.margin?.[side]).replace(/^[0-9. -]+/,'') : 'px'
                          const num = raw === '' ? undefined : Number(raw)
                          updateResponsive('margin', { ...(current.margin ?? {}), [side]: num === undefined ? undefined : `${num}${unit}` })
                        }}
                      />
                      <Select className="text-xs px-0" value={(() => {
                        const v = current.margin?.[side] ?? (widget.style?.margin as any)?.[side]
                        if (typeof v === 'string' && v.endsWith('rem')) return 'rem'
                        if (typeof v === 'string' && v.endsWith('%')) return '%'
                        return 'px'
                      })()} onChange={(e) => {
                        const unit = e.target.value
                        const v = current.margin?.[side]
                        const num = typeof v === 'number' ? v : Number(String(v ?? '0').replace(/[^0-9.-]/g,''))
                        updateResponsive('margin', { ...(current.margin ?? {}), [side]: `${num}${unit}` })
                      }}>
                        <option value="px">px</option>
                        <option value="rem">rem</option>
                        <option value="%">%</option>
                      </Select>
                    </div>
                  </Field>
                ))}
              </div>
            </div>
          )
        },
        {
          id: 'style-shadow',
          title: 'הצללה',
          children: (
            <div className="space-y-3 settings-group">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Field label="כיוון X">
                  <NumberInputUI className="w-24 h-8" value={(current.shadow?.x ?? 0) as any} onChange={(e) => updateResponsive('shadow', { ...(current.shadow ?? {}), x: (e.target as HTMLInputElement).value === '' ? undefined : Number((e.target as HTMLInputElement).value) })} />
                </Field>
                <Field label="כיוון Y">
                  <NumberInputUI className="w-24 h-8" value={(current.shadow?.y ?? 0) as any} onChange={(e) => updateResponsive('shadow', { ...(current.shadow ?? {}), y: (e.target as HTMLInputElement).value === '' ? undefined : Number((e.target as HTMLInputElement).value) })} />
                </Field>
                <Field label="טשטוש">
                  <NumberInputUI className="w-24 h-8" value={(current.shadow?.blur ?? 0) as any} onChange={(e) => updateResponsive('shadow', { ...(current.shadow ?? {}), blur: (e.target as HTMLInputElement).value === '' ? undefined : Number((e.target as HTMLInputElement).value) })} />
                </Field>
                <Field label="התפשטות">
                  <NumberInputUI className="w-24 h-8" value={(current.shadow?.spread ?? 0) as any} onChange={(e) => updateResponsive('shadow', { ...(current.shadow ?? {}), spread: (e.target as HTMLInputElement).value === '' ? undefined : Number((e.target as HTMLInputElement).value) })} />
                </Field>
              </div>
              <ColorInput label="צבע הצל" value={current.shadow?.color} onChange={(v) => updateResponsive('shadow', { ...(current.shadow ?? {}), color: v })} />
            </div>
          )
        },
        {
          id: 'style-border',
          title: 'גבול',
          children: (
            <div className="space-y-3 settings-group">
              <div className="grid grid-cols-3 gap-3 items-end">
                <Field label="רוחב">
                  <NumberInputUI className="w-20 h-8" value={(current.borderWidth ?? 0) as any} onChange={(e) => updateResponsive('borderWidth', (e.target as HTMLInputElement).value === '' ? undefined : Number((e.target as HTMLInputElement).value))} />
                </Field>
                <Field label="סוג">
                  <Select className="px-2" value={current.borderStyle ?? 'solid'} onChange={(e) => updateResponsive('borderStyle', e.target.value as any)}>
                    <option value="solid">רצוף</option>
                    <option value="dashed">מקווקו</option>
                    <option value="dotted">מנוקד</option>
                  </Select>
                </Field>
                <Field label="רדיוס">
                  <NumberInputUI className="w-20 h-8" value={(current.borderRadius ?? 0) as any} onChange={(e) => updateResponsive('borderRadius', (e.target as HTMLInputElement).value === '' ? undefined : Number((e.target as HTMLInputElement).value))} />
                </Field>
              </div>
              <ColorInput label="צבע גבול" value={current.borderColor} onChange={(v) => updateResponsive('borderColor', v)} />
            </div>
          )
        },
      ]}
    />
  )
}

export default StyleControls

