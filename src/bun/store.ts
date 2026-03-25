import { homedir } from 'node:os'
import { join } from 'node:path'
import type { RestySettings } from '../shared/rpcSchema.ts'

export type { RestySettings }

const APP_SUPPORT_DIR = join(homedir(), 'Library', 'Application Support', 'Resty')
const SETTINGS_FILE = join(APP_SUPPORT_DIR, 'settings.json')
const STATS_FILE = join(APP_SUPPORT_DIR, 'stats.json')

export interface DailyStats {
  date: string // YYYY-MM-DD
  completedBreaks: number
  skippedBreaks: number
  totalRestSeconds: number
}

const DEFAULT_SETTINGS: RestySettings = {
  workDuration: 20,
  breakDuration: 20,
  postponeDuration: 5,
  autoStart: false,
  autoStartWork: false,
  breakMessage: '望向远处，让眼睛休息一下',
}

async function ensureDir(): Promise<void> {
  await Bun.write(join(APP_SUPPORT_DIR, '.keep'), '')
}

export async function loadSettings(): Promise<RestySettings> {
  try {
    const file = Bun.file(SETTINGS_FILE)
    if (await file.exists()) {
      const data = (await file.json()) as Partial<RestySettings>
      return { ...DEFAULT_SETTINGS, ...data }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return { ...DEFAULT_SETTINGS }
}

export async function saveSettings(settings: RestySettings): Promise<void> {
  await ensureDir()
  await Bun.write(SETTINGS_FILE, JSON.stringify(settings, null, 2))
}

export async function loadStats(): Promise<DailyStats[]> {
  try {
    const file = Bun.file(STATS_FILE)
    if (await file.exists()) {
      return (await file.json()) as DailyStats[]
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  }
  return []
}

export async function saveStats(stats: DailyStats[]): Promise<void> {
  await ensureDir()
  await Bun.write(STATS_FILE, JSON.stringify(stats, null, 2))
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function getTodayStats(): Promise<DailyStats> {
  const all = await loadStats()
  const today = todayStr()
  const found = all.find((s) => s.date === today)
  if (found !== undefined) {
    return found
  }
  return {
    date: today,
    completedBreaks: 0,
    skippedBreaks: 0,
    totalRestSeconds: 0,
  }
}

export async function recordCompletedBreak(restSeconds: number): Promise<void> {
  const all = await loadStats()
  const today = todayStr()
  const idx = all.findIndex((s) => s.date === today)
  if (idx >= 0) {
    all[idx].completedBreaks += 1
    all[idx].totalRestSeconds += restSeconds
  } else {
    all.push({
      date: today,
      completedBreaks: 1,
      skippedBreaks: 0,
      totalRestSeconds: restSeconds,
    })
  }
  await saveStats(all)
}

export async function recordSkippedBreak(): Promise<void> {
  const all = await loadStats()
  const today = todayStr()
  const idx = all.findIndex((s) => s.date === today)
  if (idx >= 0) {
    all[idx].skippedBreaks += 1
  } else {
    all.push({
      date: today,
      completedBreaks: 0,
      skippedBreaks: 1,
      totalRestSeconds: 0,
    })
  }
  await saveStats(all)
}
