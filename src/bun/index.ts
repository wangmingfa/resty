import Electrobun, { ApplicationMenu, BrowserWindow, Screen, Updater, Utils } from 'electrobun/bun'
import type { RestySettings } from '../shared/rpcSchema.ts'
import { DEV_SERVER_URL } from '../shared/serverConfig.ts'
import { createRpc, sendBreakEnd, sendBreakStart, sendNavigate, sendSettingsUpdated, sendTimerTick } from './ipc.ts'
import { loadSettings } from './store.ts'
import { RestyTimer } from './timer.ts'
import { RestyTray } from './tray.ts'
import { setWindowVisibility } from './window.ts'

async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel()
  if (channel === 'dev') {
    try {
      await fetch(DEV_SERVER_URL, { method: 'HEAD' })
      console.warn(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`)
      return DEV_SERVER_URL
    } catch {
      console.warn("Vite dev server not running. Run 'bun run dev:hmr' for HMR support.")
    }
  }
  return 'views://mainview/index.html'
}

// 加载配置
const settings: RestySettings = await loadSettings()

// 创建计时器
const timer = new RestyTimer(settings)

// 创建主窗口 URL
const url = await getMainViewUrl()

// 用 holder 解决 rpc <-> mainWindow 循环依赖
const windowHolder: { current: BrowserWindow | null } = { current: null }

// 创建主进程 RPC
const rpc = createRpc(
  timer,
  settings,
  (newSettings: RestySettings) => {
    Object.assign(settings, newSettings)
    sendSettingsUpdated(rpc, newSettings)
  },
  () => {
    windowHolder.current?.show()
    sendNavigate(rpc, '/settings')
  },
  (_path: string) => {
    // renderer 发起的导航，暂不处理
  },
  windowHolder,
)

// 创建主窗口
// titleBarStyle: 'hidden' 隐藏系统标题栏（使用自定义交通灯）
// titleBarStyle: 'default' 显示系统原生标题栏
const MAIN_WINDOW_WIDTH = 420
const MAIN_WINDOW_HEIGHT = 600
const mainWindow = new BrowserWindow({
  title: 'Resty',
  url,
  rpc,
  titleBarStyle: 'hiddenInset',
  frame: {
    width: MAIN_WINDOW_WIDTH,
    height: MAIN_WINDOW_HEIGHT,
    x: 200,
    y: 100,
  },
  styleMask: {
    Closable: false,
    Resizable: false,
    FullScreen: false,
    Miniaturizable: false,
    UtilityWindow: true,
  },
})
mainWindow.setAlwaysOnTop(true)
Utils.setDockIconVisible(false)

// 填充 holder
windowHolder.current = mainWindow

function setMainWindowVisibility(visible: boolean): void {
  setWindowVisibility(mainWindow, visible)
}

// 休息遮罩窗口（每个显示器一个）
const breakWindows: BrowserWindow[] = []
const breakRpcs: Array<ReturnType<typeof createRpc>> = []

function openBreakWindows(): void {
  if (breakWindows.length > 0) {
    return
  }

  const breakUrl = url.startsWith('http') ? `${url}/break.html` : 'views://mainview/break.html'

  // 获取所有显示器
  let displays = Screen.getAllDisplays()
  if (displays.length === 0) {
    // 回退：使用主显示器
    const primary = Screen.getPrimaryDisplay()
    displays = [primary]
  }

  for (const display of displays) {
    const { x, y, width, height } = display.bounds

    console.log('休息页', breakUrl, x, y, width, height)

    // 用 holder 解决 rpc <-> win 循环依赖
    const breakWindowHolder: { current: BrowserWindow | null } = { current: null }

    const breakRpc = createRpc(
      timer,
      settings,
      (newSettings: RestySettings) => {
        Object.assign(settings, newSettings)
      },
      () => {
        /* break 窗口不需要打开设置 */
      },
      () => {
        /* break 窗口不需要处理导航 */
      },
      breakWindowHolder,
    )

    const win = new BrowserWindow({
      title: 'Resty - Break',
      url: breakUrl,
      rpc: breakRpc,
      titleBarStyle: 'hidden',
      frame: {
        x,
        y: y - 30,
        width,
        height: height + 30,
      },
      // 默认不显示，等待页面加载完，在src/mainview/BreakApp.vue中调用window:show进行显示
      // 解决打开页面时，会白屏闪烁的问题
      hidden: true,
      styleMask: {
        Borderless: true, // 无边框（关键）
        Titled: false, // 无标题栏
        Closable: false, // 禁止关闭
        Miniaturizable: false, // 禁止最小化
        Resizable: false, // 禁止缩放

        FullSizeContentView: true,

        // 下面这些建议开启
        // NonactivatingPanel: false,
        // UtilityWindow: false,
        // HUDWindow: false,
      },
    })
    win.setFullScreen(true)
    win.setVisibleOnAllWorkspaces(true)
    win.setAlwaysOnTop(true)
    breakWindowHolder.current = win

    // setTimeout(() => {
    //   win.show()
    // }, 100)

    // 不用 setFullScreen（会导致 webview 不 resize）
    // 直接用屏幕坐标 + alwaysOnTop 覆盖全屏
    /*setTimeout(() => {
      win.setAlwaysOnTop(true);
      win.setVisibleOnAllWorkspaces(true);
      // 确保 frame 覆盖整个显示器（包含 menubar 区域）
      win.setFrame(x, y - 30, width, height + 30);
    }, 300);*/

    breakWindows.push(win)
    breakRpcs.push(breakRpc)
  }
}

function closeBreakWindows(): void {
  for (const win of breakWindows) {
    try {
      win.close()
    } catch {
      /* ignore close errors */
    }
  }
  breakWindows.length = 0
  breakRpcs.length = 0
}

// 创建托盘
const tray = new RestyTray({
  onStart: () => {
    timer.start()
  },
  onPause: () => {
    timer.pause()
  },
  onResume: () => {
    timer.resume()
  },
  onTriggerBreak: () => {
    timer.triggerBreak()
  },
  onOpenSettings: () => {
    // windowHolder.current?.show()
    setMainWindowVisibility(true)
    sendNavigate(rpc, '/settings')
  },
  onQuit: () => {
    process.exit(0)
  },
})

// 注册计时器回调
timer.setOnTick((state) => {
  tray.update(state)
  sendTimerTick(rpc, state)
  for (const breakRpc of breakRpcs) {
    sendTimerTick(breakRpc, state)
  }
})

timer.setOnBreakStart((breakDuration) => {
  setMainWindowVisibility(false)
  openBreakWindows()
  sendBreakStart(rpc, breakDuration)
  for (const breakRpc of breakRpcs) {
    sendBreakStart(breakRpc, breakDuration)
  }
})

timer.setOnBreakEnd(() => {
  setMainWindowVisibility(true)
  closeBreakWindows()
  sendBreakEnd(rpc)
})

// 按设置决定是否自动启动计时器
if (settings.autoStartWork) {
  timer.start()
}

// 设置标准 macOS 应用菜单，确保 Cmd+Q 走 Electrobun 的 before-quit 流程
ApplicationMenu.setApplicationMenu([
  {
    label: 'Resty',
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'showAll' },
      { type: 'separator' },
      {
        label: '退出 Resty',
        action: 'app-quit',
        accelerator: 'Cmd+Q',
      },
    ],
  },
  // {
  //   label: '编辑',
  //   submenu: [
  //     { role: 'undo' },
  //     { role: 'redo' },
  //     { type: 'separator' },
  //     { role: 'cut' },
  //     { role: 'copy' },
  //     { role: 'paste' },
  //     { role: 'selectAll' },
  //   ],
  // },
])

// 监听应用菜单的退出动作
ApplicationMenu.on('application-menu-clicked', (e: unknown) => {
  const event = e as { data: { action: string } }
  if (event.data.action === 'app-quit') {
    timer.stop()
    process.exit(0)
  }
})

// 监听应用退出事件（托盘退出、程序内退出等）
Electrobun.events.on('before-quit', (_e: { response: { allow: boolean } }) => {
  console.warn('before-quit triggered', new Date().toLocaleString())
  timer.stop()
})

console.warn('Resty started!')
