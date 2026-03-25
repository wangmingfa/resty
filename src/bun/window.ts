import type { BrowserWindow } from 'electrobun/bun'

const windowSizeCache = new WeakMap<BrowserWindow, { width: number; height: number }>()

export function setWindowVisibility(window: BrowserWindow, visible: boolean): void {
  if (visible) {
    // Utils.setDockIconVisible(true)
    const { width, height } = windowSizeCache.get(window) ?? window.getSize()
    window.setSize(width, height)
    window.show()
    setTimeout(() => {
      window.focus()
    }, 100)
  } else {
    // Utils.setDockIconVisible(false)
    const { width, height } = window.getSize()
    window.setSize(0, 0)
    windowSizeCache.set(window, { width, height })
  }
}
