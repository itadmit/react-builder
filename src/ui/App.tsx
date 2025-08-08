import { Builder } from '@/ui/builder/Builder'
import { CommandPalette } from '@/ui/builder/CommandPalette'

export function App() {
  return (
    <div className="h-full">
      <Builder />
      <CommandPalette />
    </div>
  )
}

