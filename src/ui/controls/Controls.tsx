import React, { useEffect, useRef, useState } from 'react'
import { RgbaStringColorPicker } from 'react-colorful'

export function Field({ label, children, helper, icon }: { label: string; children: React.ReactNode; helper?: string; icon?: React.ReactNode }) {
  return (
    <label className="text-sm grid gap-1">
      <span className="text-[13px] text-zinc-700 dark:text-zinc-300 flex items-center gap-2">{icon}{label}</span>
      {children}
      {helper && <span className="text-[10px] text-zinc-500">{helper}</span>}
    </label>
  )
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        `h-9 rounded-md border px-2 text-xs bg-white/80 dark:bg-zinc-900/80 max-w-full ` +
        `focus:outline-none focus:ring-2 focus:ring-[var(--qs-primary)] focus:border-transparent ` +
        (props.className ?? '')
      }
    />
  )
}

export function NumberInputUI(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <TextInput
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      className={`${props.className ?? ''} w-[50px] max-w-[50px] min-w-[50px] placeholder:text-xs`}
      {...props}
      style={{ ...(props.style || {}), width: '50px', maxWidth: '50px' }}
    />
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        `h-9 rounded-md border text-xs bg-white/80 dark:bg-zinc-900/80 ` +
        `focus:outline-none focus:ring-2 focus:ring-[var(--qs-primary)] focus:border-transparent ` +
        (props.className ?? '')
      }
    />
  )
}

function hexToRgbaString(hex: string): string {
  const raw = hex.replace('#','')
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16)
    const g = parseInt(raw[1] + raw[1], 16)
    const b = parseInt(raw[2] + raw[2], 16)
    return `rgba(${r},${g},${b},1)`
  }
  const r = parseInt(raw.slice(0,2), 16)
  const g = parseInt(raw.slice(2,4), 16)
  const b = parseInt(raw.slice(4,6), 16)
  return `rgba(${r},${g},${b},1)`
}

export function ColorPicker({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const [open, setOpen] = useState(false)
  const [openAbove, setOpenAbove] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])
  const rgbaValue = (() => {
    if (!value) return 'rgba(0,0,0,1)'
    if (value === 'transparent') return 'rgba(0,0,0,0)'
    if (value.startsWith('rgba(')) return value
    if (value.startsWith('#')) return hexToRgbaString(value)
    return value
  })()

  function isTransparent(v?: string): boolean {
    if (!v) return false
    if (v === 'transparent') return true
    if (v.startsWith('rgba(')) {
      const m = v.match(/rgba\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)/)
      if (m) {
        const a = parseFloat(m[4])
        return a === 0
      }
    }
    return false
  }

  const swatchBg: React.CSSProperties = !isTransparent(value) ? { background: value ?? '#000000' } : {
    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
    backgroundSize: '10px 10px',
    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
  }

  return (
    <div className="flex items-center gap-2">
      <div ref={ref} className={`relative color-field ${open ? 'open' : ''}`}>
        <button type="button" className="h-9 w-9 rounded-md border cursor-pointer" style={swatchBg} onClick={() => {
          if (!open && ref.current) {
            // בדיקה אם יש מקום מתחת או צריך לפתוח מעל
            const rect = ref.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const spaceAbove = rect.top
            const popoverHeight = 300 // גובה משוער של הקולור פיקר
            
            if (spaceBelow < popoverHeight && spaceAbove > popoverHeight) {
              setOpenAbove(true)
            } else {
              setOpenAbove(false)
            }
          }
          setOpen((v) => !v)
        }} />
        <div className={`color-popover absolute z-50 p-2 bg-white border rounded shadow-md hidden ${openAbove ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] text-zinc-600">כולל שקיפות</span>
            <button className="text-[11px] underline" onClick={() => onChange('rgba(0,0,0,0)')}>שקוף</button>
          </div>
          <RgbaStringColorPicker color={rgbaValue} onChange={(c) => onChange(c)} />
        </div>
      </div>
      <TextInput className="w-[110px] max-w-[110px] min-w-[110px] placeholder:text-xs" placeholder="#000000 או rgba()" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)} />
    </div>
  )
}

