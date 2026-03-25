import { Electroview } from 'electrobun/view'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RestyRPCSchema, RestySettings } from '../../shared/rpcSchema.ts'

export type { RestySettings }

const DEFAULT_SETTINGS: RestySettings = {
  workDuration: 20,
  breakDuration: 20,
  postponeDuration: 5,
  autoStart: false,
  autoStartWork: false,
  breakMessage: '望向远处，让眼睛休息一下',
}

// 创建渲染进程 RPC（webview 侧只监听消息，不处理请求）
export const rpc = Electroview.defineRPC<RestyRPCSchema>({
  handlers: {
    requests: {},
    messages: {},
  },
})

// 初始化 Electroview（建立与主进程的 WebSocket 连接）
export const electroview = new Electroview({ rpc })

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<RestySettings>({ ...DEFAULT_SETTINGS })
  const loaded = ref(false)

  async function load(): Promise<void> {
    try {
      const result = await rpc.request['settings:get']({})
      settings.value = { ...DEFAULT_SETTINGS, ...result }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
    loaded.value = true
  }

  async function save(newSettings: Partial<RestySettings>): Promise<void> {
    settings.value = { ...settings.value, ...newSettings }
    try {
      await rpc.request['settings:save'](settings.value)
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  function applyFromIpc(newSettings: RestySettings): void {
    settings.value = { ...DEFAULT_SETTINGS, ...newSettings }
  }

  return {
    settings,
    loaded,
    load,
    save,
    applyFromIpc,
  }
})
