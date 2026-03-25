import { homedir } from 'node:os'
import { join } from 'node:path'

const PLIST_LABEL = 'xyz.resty.app'
const PLIST_PATH = join(homedir(), 'Library', 'LaunchAgents', `${PLIST_LABEL}.plist`)

function buildPlist(appPath: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
  <string>${appPath}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
</dict>
</plist>`
}

export async function enableAutoStart(appPath: string): Promise<void> {
  try {
    await Bun.write(PLIST_PATH, buildPlist(appPath))
    console.warn(`AutoStart enabled: ${PLIST_PATH}`)
  } catch (e) {
    console.error('Failed to enable autostart:', e)
    throw e
  }
}

export async function disableAutoStart(): Promise<void> {
  try {
    const file = Bun.file(PLIST_PATH)
    if (await file.exists()) {
      await Bun.$`rm -f ${PLIST_PATH}`
      console.warn('AutoStart disabled')
    }
  } catch (e) {
    console.error('Failed to disable autostart:', e)
    throw e
  }
}

export async function isAutoStartEnabled(): Promise<boolean> {
  try {
    const file = Bun.file(PLIST_PATH)
    return await file.exists()
  } catch {
    return false
  }
}
