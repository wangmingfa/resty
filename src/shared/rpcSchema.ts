// 共享 RPC Schema 类型定义（主进程和渲染进程共用）
// 不能引入任何 bun/node 专用模块

export interface RestySettings {
  workDuration: number
  breakDuration: number
  postponeDuration: number
  autoStart: boolean
  autoStartWork: boolean
  breakMessage: string
}

export interface StatsToday {
  date: string
  completedBreaks: number
  skippedBreaks: number
  totalRestSeconds: number
}

export interface StatsHistory {
  date: string
  completedBreaks: number
  skippedBreaks: number
  totalRestSeconds: number
}

export interface RestyRPCSchema {
  bun: {
    requests: {
      'window:close': { params: Record<string, never>; response: { ok: boolean } }
      'window:show': { params: Record<string, never>; response: { ok: boolean } }
      'window:hide': { params: Record<string, never>; response: { ok: boolean } }
      'window:minimize': { params: Record<string, never>; response: { ok: boolean } }
      'window:maximize': { params: Record<string, never>; response: { ok: boolean } }
      'break:skip': { params: Record<string, never>; response: { ok: boolean } }
      'break:exit': { params: Record<string, never>; response: { ok: boolean } }
      'break:postpone': { params: { minutes: number }; response: { ok: boolean } }
      'settings:save': { params: RestySettings; response: { ok: boolean } }
      'settings:get': { params: Record<string, never>; response: RestySettings }
      'timer:start': { params: Record<string, never>; response: { ok: boolean } }
      'timer:pause': { params: Record<string, never>; response: { ok: boolean } }
      'timer:resume': { params: Record<string, never>; response: { ok: boolean } }
      'timer:trigger-break': { params: Record<string, never>; response: { ok: boolean } }
      'stats:today': { params: Record<string, never>; response: StatsToday }
      'stats:history': { params: Record<string, never>; response: StatsHistory[] }
      'app:open-settings': { params: Record<string, never>; response: { ok: boolean } }
    }
    messages: {
      'app:navigate': { path: string }
    }
  }
  webview: {
    requests: Record<string, never>
    messages: {
      'timer:tick': {
        phase: 'working' | 'resting' | 'paused' | 'idle'
        remainingSeconds: number
        workDuration: number
        breakDuration: number
      }
      'timer:break-start': { breakDuration: number }
      'timer:break-end': Record<string, never>
      'settings:updated': RestySettings
      'app:navigate': { path: string }
    }
  }
}

type RpcRequestHandlers<T extends Record<string, { params: unknown; response: unknown }>> = {
  [K in keyof T]: (params: T[K]['params']) => Promise<T[K]['response']>
}

export type RestyBunRequests = RpcRequestHandlers<RestyRPCSchema['bun']['requests']>
