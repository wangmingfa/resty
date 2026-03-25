import type { RestySettings } from './store.ts'
import { recordCompletedBreak, recordSkippedBreak } from './store.ts'

export type TimerPhase = 'working' | 'resting' | 'paused' | 'idle'

export interface TimerState {
  phase: TimerPhase
  remainingSeconds: number // 当前阶段剩余秒数
  workDuration: number // 工作时长（秒）
  breakDuration: number // 休息时长（秒）
}

type TickCallback = (state: TimerState) => void
type BreakStartCallback = (breakDuration: number) => void
type BreakEndCallback = () => void

export class RestyTimer {
  private phase: TimerPhase = 'idle'
  private remainingSeconds = 0
  private workDuration: number = 20 * 60
  private breakDuration = 20
  private pausedPhase: TimerPhase | null = null

  private intervalId: ReturnType<typeof setInterval> | null = null

  private onTick: TickCallback | null = null
  private onBreakStart: BreakStartCallback | null = null
  private onBreakEnd: BreakEndCallback | null = null

  constructor(settings: RestySettings) {
    this.applySettings(settings)
  }

  applySettings(settings: RestySettings): void {
    this.workDuration = settings.workDuration * 60
    this.breakDuration = settings.breakDuration
  }

  setOnTick(cb: TickCallback): void {
    this.onTick = cb
  }
  setOnBreakStart(cb: BreakStartCallback): void {
    this.onBreakStart = cb
  }
  setOnBreakEnd(cb: BreakEndCallback): void {
    this.onBreakEnd = cb
  }

  start(): void {
    if (this.phase === 'idle' || this.phase === 'paused') {
      this.phase = 'working'
      this.remainingSeconds = this.workDuration
      this.startInterval()
      // 立即 emit 一次，让 UI 不必等第一个 tick（1秒）才更新
      this.emitTick()
    }
  }

  pause(): void {
    if (this.phase === 'working' || this.phase === 'resting') {
      this.pausedPhase = this.phase
      this.phase = 'paused'
      this.stopInterval()
      this.emitTick()
    }
  }

  resume(): void {
    if (this.phase === 'paused' && this.pausedPhase !== null) {
      this.phase = this.pausedPhase
      this.pausedPhase = null
      this.startInterval()
      this.emitTick() // 立即发送状态更新
    }
  }

  triggerBreak(): void {
    this.stopInterval()
    this.phase = 'resting'
    this.remainingSeconds = this.breakDuration
    this.onBreakStart?.(this.breakDuration)
    this.startInterval()
    this.emitTick() // 立即发送状态更新
  }

  skipBreak(): void {
    if (this.phase === 'resting') {
      this.stopInterval()
      recordSkippedBreak().catch(console.error)
      this.startWorking()
      this.onBreakEnd?.()
    }
  }

  postponeBreak(minutes: number): void {
    if (this.phase === 'resting') {
      this.stopInterval()
      recordSkippedBreak().catch(console.error)
      this.phase = 'working'
      this.remainingSeconds = minutes * 60
      this.startInterval()
      this.emitTick() // 立即发送状态更新
      this.onBreakEnd?.()
    }
  }

  getState(): TimerState {
    return {
      phase: this.phase,
      remainingSeconds: this.remainingSeconds,
      workDuration: this.workDuration,
      breakDuration: this.breakDuration,
    }
  }

  stop(): void {
    this.stopInterval()
    this.phase = 'idle'
  }

  private startWorking(): void {
    this.phase = 'working'
    this.remainingSeconds = this.workDuration
    this.startInterval()
    this.emitTick() // 立即发送状态更新
  }

  private startInterval(): void {
    this.stopInterval()
    this.intervalId = setInterval(() => {
      this.tick()
    }, 1000)
  }

  private stopInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private tick(): void {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds -= 1
    }

    this.emitTick()

    if (this.remainingSeconds <= 0) {
      if (this.phase === 'working') {
        this.stopInterval()
        this.triggerBreak()
      } else if (this.phase === 'resting') {
        this.stopInterval()
        recordCompletedBreak(this.breakDuration).catch(console.error)
        this.startWorking()
        this.onBreakEnd?.()
      }
    }
  }

  private emitTick(): void {
    this.onTick?.({
      phase: this.phase,
      remainingSeconds: this.remainingSeconds,
      workDuration: this.workDuration,
      breakDuration: this.breakDuration,
    })
  }
}
