import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { rpc } from './settingsStore.ts'

export type TimerPhase = 'working' | 'resting' | 'paused' | 'idle'

export interface TimerState {
  phase: TimerPhase
  remainingSeconds: number
  workDuration: number
  breakDuration: number
}

export const useTimerStore = defineStore('timer', () => {
  const phase = ref<TimerPhase>('idle')
  const remainingSeconds = ref(0)
  const workDuration = ref(20 * 60)
  const breakDuration = ref(20)

  const formattedRemaining = computed(() => {
    const s = remainingSeconds.value
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const progress = computed(() => {
    if (phase.value === 'resting') {
      return 1 - remainingSeconds.value / breakDuration.value
    }
    if (phase.value === 'working') {
      return 1 - remainingSeconds.value / workDuration.value
    }
    return 0
  })

  function updateFromTick(state: TimerState): void {
    phase.value = state.phase
    remainingSeconds.value = state.remainingSeconds
    workDuration.value = state.workDuration
    breakDuration.value = state.breakDuration
  }

  async function start(): Promise<void> {
    try {
      await rpc.request['timer:start']({})
    } catch (e) {
      console.error('Failed to start timer:', e)
    }
  }

  async function pause(): Promise<void> {
    try {
      await rpc.request['timer:pause']({})
    } catch (e) {
      console.error('Failed to pause timer:', e)
    }
  }

  async function resume(): Promise<void> {
    try {
      await rpc.request['timer:resume']({})
    } catch (e) {
      console.error('Failed to resume timer:', e)
    }
  }

  async function triggerBreak(): Promise<void> {
    try {
      await rpc.request['timer:trigger-break']({})
    } catch (e) {
      console.error('Failed to trigger break:', e)
    }
  }

  async function skipBreak(): Promise<void> {
    try {
      await rpc.request['break:skip']({})
    } catch (e) {
      console.error('Failed to skip break:', e)
    }
  }

  async function exitBreak(): Promise<void> {
    try {
      await rpc.request['break:exit']({})
    } catch (e) {
      console.error('Failed to exit break:', e)
    }
  }

  async function postponeBreak(minutes: number): Promise<void> {
    try {
      await rpc.request['break:postpone']({ minutes })
    } catch (e) {
      console.error('Failed to postpone break:', e)
    }
  }

  return {
    phase,
    remainingSeconds,
    workDuration,
    breakDuration,
    formattedRemaining,
    progress,
    updateFromTick,
    start,
    pause,
    resume,
    triggerBreak,
    skipBreak,
    exitBreak,
    postponeBreak,
  }
})
