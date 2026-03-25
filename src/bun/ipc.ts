import type { BrowserWindow } from 'electrobun/bun'
import { BrowserView } from 'electrobun/bun'
import type { RestyBunRequests, RestyRPCSchema, RestySettings } from '../shared/rpcSchema.ts'
import { disableAutoStart, enableAutoStart } from './autostart.ts'
import { getTodayStats, loadStats, saveSettings } from './store.ts'
import type { RestyTimer } from './timer.ts'
import { setWindowVisibility } from './window.ts'

export type { RestyRPCSchema, RestySettings }

export function createRpc(
  timer: RestyTimer,
  settings: RestySettings,
  onSettingsUpdate: (s: RestySettings) => void,
  onOpenSettings: () => void,
  onNavigate: (path: string) => void,
  windowHolder?: { current: BrowserWindow | null },
): ReturnType<typeof BrowserView.defineRPC<RestyRPCSchema>> {
  return BrowserView.defineRPC<RestyRPCSchema>({
    handlers: {
      requests: {
        'window:close': () => {
          // 关闭窗口时最小化到 Dock，而不是退出应用
          // (Electrobun 暂无 hide() API，使用 minimize() 替代)
          windowHolder?.current?.minimize()
          return Promise.resolve({ ok: true })
        },
        'window:show': () => {
          const window = windowHolder?.current
          if (window) {
            setWindowVisibility(window, true)
          }
          return Promise.resolve({ ok: true })
        },
        'window:hide': () => {
          const window = windowHolder?.current
          if (window) {
            setWindowVisibility(window, false)
          }
          return Promise.resolve({ ok: true })
        },
        'window:minimize': () => {
          windowHolder?.current?.minimize()
          return Promise.resolve({ ok: true })
        },
        'window:maximize': () => {
          const win = windowHolder?.current
          if (win?.isMaximized() === true) {
            win.unmaximize()
          } else {
            win?.maximize()
          }
          return Promise.resolve({ ok: true })
        },
        'break:skip': () => {
          timer.skipBreak()
          return Promise.resolve({ ok: true })
        },
        'break:exit': () => {
          // 手动退出休息（不受严格模式限制，允许用户主动结束）
          timer.skipBreak()
          return Promise.resolve({ ok: true })
        },
        'break:postpone': ({ minutes }) => {
          timer.postponeBreak(minutes)
          return Promise.resolve({ ok: true })
        },
        'settings:save': async (newSettings) => {
          Object.assign(settings, newSettings)
          await saveSettings(newSettings)
          timer.applySettings(newSettings)
          if (newSettings.autoStart) {
            await enableAutoStart(process.execPath).catch(console.error)
          } else {
            await disableAutoStart().catch(console.error)
          }
          onSettingsUpdate(newSettings)
          return { ok: true }
        },
        'settings:get': () => {
          return Promise.resolve(settings)
        },
        'timer:start': () => {
          timer.start()
          return Promise.resolve({ ok: true })
        },
        'timer:pause': () => {
          timer.pause()
          return Promise.resolve({ ok: true })
        },
        'timer:resume': () => {
          timer.resume()
          return Promise.resolve({ ok: true })
        },
        'timer:trigger-break': () => {
          timer.triggerBreak()
          return Promise.resolve({ ok: true })
        },
        'stats:today': async () => {
          return getTodayStats()
        },
        'stats:history': async () => {
          return loadStats()
        },
        'app:open-settings': () => {
          onOpenSettings()
          return Promise.resolve({ ok: true })
        },
      } as RestyBunRequests,
      messages: {
        'app:navigate': ({ path }) => {
          onNavigate(path)
        },
      },
    },
  })
}

export type RestyRpc = ReturnType<typeof createRpc>

export function sendTimerTick(
  rpc: RestyRpc,
  state: {
    phase: 'working' | 'resting' | 'paused' | 'idle'
    remainingSeconds: number
    workDuration: number
    breakDuration: number
  },
): void {
  try {
    rpc.send['timer:tick'](state)
  } catch {
    /* ignore send errors */
  }
}

export function sendBreakStart(rpc: RestyRpc, breakDuration: number): void {
  try {
    rpc.send['timer:break-start']({ breakDuration })
  } catch {
    /* ignore send errors */
  }
}

export function sendBreakEnd(rpc: RestyRpc): void {
  try {
    rpc.send['timer:break-end']({})
  } catch {
    /* ignore send errors */
  }
}

export function sendSettingsUpdated(rpc: RestyRpc, settings: RestySettings): void {
  try {
    rpc.send['settings:updated'](settings)
  } catch {
    /* ignore send errors */
  }
}

export function sendNavigate(rpc: RestyRpc, path: string): void {
  try {
    rpc.send['app:navigate']({ path })
  } catch {
    /* ignore send errors */
  }
}
