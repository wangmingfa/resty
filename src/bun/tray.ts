import type { MenuItemConfig } from 'electrobun/bun'
import { Tray } from 'electrobun/bun'
import type { TimerState } from './timer.ts'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 菜单 action 常量
const ACTION_START = 'start'
const ACTION_PAUSE = 'pause'
const ACTION_RESUME = 'resume'
const ACTION_TRIGGER_BREAK = 'trigger-break'
const ACTION_OPEN_SETTINGS = 'open-settings'
const ACTION_QUIT = 'quit'

// 平台判断
const isWindows = process.platform === 'win32'

interface TrayActions {
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onTriggerBreak: () => void
  onOpenSettings: () => void
  onQuit: () => void
}

interface TrayClickEvent {
  data?: { action?: string }
  action?: string
}

export class RestyTray {
  private readonly tray: Tray
  private readonly actions: TrayActions
  private isPaused = false
  private isIdle = true
  private lastMenuKey = ''

  constructor(actions: TrayActions) {
    this.actions = actions
    this.tray = new Tray({
      title: isWindows ? '' : 'Resty',
      // Windows 托盘必须提供图标，否则不显示
      // 使用 icon.iconset 里的 16x16 图标
      // Windows 托盘使用 ICO 格式（含多尺寸），确保正确显示
      image: isWindows ? 'views://mainview/tray-icon.ico' : '',
      width: 32,
      height: 32,
    })
    this.updateMenu()

    // 监听托盘菜单点击事件
    this.tray.on('tray-clicked', (event: unknown) => {
      const e = event as TrayClickEvent
      const action = e.data?.action ?? e.action ?? ''
      this.handleAction(action)
    })
  }

  private handleAction(action: string): void {
    const base = action.split('|')[0]
    switch (base) {
      case ACTION_START:
        this.actions.onStart()
        break
      case ACTION_PAUSE:
        this.actions.onPause()
        break
      case ACTION_RESUME:
        this.actions.onResume()
        break
      case ACTION_TRIGGER_BREAK:
        this.actions.onTriggerBreak()
        break
      case ACTION_OPEN_SETTINGS:
        this.actions.onOpenSettings()
        break
      case ACTION_QUIT:
        this.actions.onQuit()
        break
    }
  }

  update(state: TimerState): void {
    const newIsPaused = state.phase === 'paused'
    const newIsIdle = state.phase === 'idle'
    const timeStr = formatTime(state.remainingSeconds)

    // 更新标题（每秒都可以变）
    // macOS：显示在菜单栏；Windows：托盘不显示文字标题，setTitle 为空即可
    if (state.phase === 'working') {
      this.tray.setTitle(isWindows ? '' : timeStr)
    } else if (state.phase === 'resting') {
      this.tray.setTitle(isWindows ? '' : `😴 ${timeStr}`)
    } else if (state.phase === 'paused') {
      this.tray.setTitle(isWindows ? '' : `⏸ ${timeStr}`)
    } else {
      this.tray.setTitle(isWindows ? '' : 'Resty')
    }

    // 只有阶段真正切换时才重建菜单
    if (newIsPaused !== this.isPaused || newIsIdle !== this.isIdle) {
      this.isPaused = newIsPaused
      this.isIdle = newIsIdle
      this.updateMenu()
    }
  }

  private updateMenu(): void {
    const menuKey = `${String(this.isPaused)}|${String(this.isIdle)}`
    if (menuKey === this.lastMenuKey) return
    this.lastMenuKey = menuKey

    const items: MenuItemConfig[] = []

    if (this.isIdle) {
      items.push({
        type: 'normal',
        label: '开始计时',
        action: ACTION_START,
      })
    } else {
      items.push({
        type: 'normal',
        label: this.isPaused ? '恢复提醒' : '暂停提醒',
        action: this.isPaused ? ACTION_RESUME : ACTION_PAUSE,
      })
      items.push({
        type: 'normal',
        label: '立即休息',
        action: ACTION_TRIGGER_BREAK,
      })
    }

    items.push(
      { type: 'separator' },
      {
        type: 'normal',
        label: '设置...',
        action: ACTION_OPEN_SETTINGS,
      },
      {
        type: 'normal',
        label: '退出 Resty',
        action: ACTION_QUIT,
      },
    )

    this.tray.setMenu(items)
  }
}
