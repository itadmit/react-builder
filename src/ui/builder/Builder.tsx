import { Sidebar } from './Sidebar'
import { Canvas } from './Canvas'
import { Inspector } from './Inspector'
import { Toolbar } from './Toolbar'

export function Builder() {
  return (
    <div className="h-full grid grid-rows-[auto_1fr]">
      <Toolbar />
      <div className="grid grid-cols-[280px_1fr_320px] h-[calc(100vh-40px)] overflow-hidden">
        <div className="panel border-r border-zinc-200 overflow-hidden">
          <Sidebar />
        </div>
        <div className="canvas-column overflow-hidden">
          <Canvas />
        </div>
        <div className="panel border-l border-zinc-200 overflow-hidden">
          <Inspector />
        </div>
      </div>
    </div>
  )
}

