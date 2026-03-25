
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CountdownTimer from '../components/CountdownTimer.vue'
import type { TimerState } from '../stores/timerStore.ts'
import { useTimerStore } from '../stores/timerStore.ts'
import type { RestySettings } from '../stores/settingsStore.ts'
import { rpc, useSettingsStore } from '../stores/settingsStore.ts'

const router = useRouter()
const timerStore = useTimerStore()
const settingsStore = useSettingsStore()

interface TodayStats {
  completedBreaks: number;
  skippedBreaks: number;
  totalRestSeconds: number;
}

const todayStats = ref<TodayStats>({
  completedBreaks: 0,
  skippedBreaks: 0,
  totalRestSeconds: 0,
})

const isResuming = ref(false)

const phaseText = computed(() => {
  switch (timerStore.phase) {
    case 'working': return '专注工作中'
    case 'resting': return '休息中'
    case 'paused': return '已暂停'
    default: return '准备就绪'
  }
})

async function handleResume(): Promise<void> {
  isResuming.value = true
  try {
    await timerStore.resume()
  } finally {
    isResuming.value = false
  }
}

const formattedTotalRest = computed(() => {
  const s = todayStats.value.totalRestSeconds
  const m = Math.floor(s / 60)
  return m > 0 ? `${String(m)}分钟` : `${String(s)}秒`
})

async function loadTodayStats(): Promise<void> {
  try {
    todayStats.value = await rpc.request['stats:today']({})
  } catch (e) {
    console.error('Failed to load today stats:', e)
  }
}

onMounted(() => {
  void settingsStore.load()
  void loadTodayStats()

  rpc.addMessageListener('timer:tick', (state: TimerState) => {
    timerStore.updateFromTick(state)
  })

  rpc.addMessageListener('timer:break-end', () => {
    void loadTodayStats()
  })

  rpc.addMessageListener('settings:updated', (s: RestySettings) => {
    settingsStore.applyFromIpc(s)
  })

  rpc.addMessageListener('app:navigate', ({ path }) => {
    void router.push(path)
  })
})
</script>

<template>
  <div class="home-view">
    <div class="main-content">
      <CountdownTimer
        :remaining-seconds="timerStore.remainingSeconds"
        :total-seconds="timerStore.phase === 'resting' ? timerStore.breakDuration : timerStore.workDuration"
        :phase="timerStore.phase"
        :size="240"
        :stroke-width="12"
      />

      <div class="status-info">
        <div
          class="status-badge"
          :class="timerStore.phase"
        >
          {{ phaseText }}
        </div>
      </div>

      <div class="action-buttons">
        <button
          v-if="timerStore.phase === 'idle'"
          class="btn btn-primary"
          @click="timerStore.start()"
        >
          ▶ 开始计时
        </button>
        <button
          v-if="timerStore.phase === 'working'"
          class="btn btn-secondary"
          @click="timerStore.pause()"
        >
          ⏸ 暂停
        </button>
        <button
          v-else-if="timerStore.phase === 'paused'"
          class="btn btn-primary"
          :class="{ loading: isResuming }"
          :disabled="isResuming"
          @click="handleResume"
        >
          <span v-if="!isResuming">▶ 继续</span>
          <span
            v-else
            class="spinner"
          />
        </button>
        <button
          v-if="timerStore.phase === 'working' || timerStore.phase === 'paused'"
          class="btn btn-accent"
          @click="timerStore.triggerBreak()"
        >
          😴 立即休息
        </button>
      </div>

      <div class="today-stats">
        <div class="stat-item">
          <span class="stat-value">{{ todayStats.completedBreaks }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-value">{{ todayStats.skippedBreaks }}</span>
          <span class="stat-label">已跳过</span>
        </div>
        <div class="stat-divider" />
        <div class="stat-item">
          <span class="stat-value">{{ formattedTotalRest }}</span>
          <span class="stat-label">总休息</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  height: 100%;
  background: linear-gradient(to bottom, #0f172a 0%, #1e293b 50%, #0f2027 100%);
  display: flex;
  flex-direction: column;
  color: white;
  overflow: hidden;
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 32px 24px;
}

.status-badge {
  padding: 6px 18px;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-badge.working {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.status-badge.resting {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.status-badge.paused {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.status-badge.idle {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-buttons { display: flex; gap: 12px; }

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:active {
  transform: scale(0.96);
}

.btn-primary {
  background: #4ade80;
  color: #0f172a;
}

.btn-primary:hover {
  background: #22c55e;
  transform: translateY(-1px);
}

.btn-primary:active {
  background: #16a34a;
  transform: scale(0.96);
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
}

.btn.loading {
  position: relative;
}

/* Loading 旋转动画 */
.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(15, 23, 42, 0.3);
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.16);
}

.btn-secondary:active {
  background: rgba(255, 255, 255, 0.08);
  transform: scale(0.96);
}

.btn-accent {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.25);
}

.btn-accent:hover {
  background: rgba(96, 165, 250, 0.25);
}

.btn-accent:active {
  background: rgba(96, 165, 250, 0.12);
  transform: scale(0.96);
}

.today-stats {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px 32px;
  width: 100%;
  max-width: 340px;
  justify-content: space-between;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value { font-size: 1.5rem; font-weight: 700; color: white; }
.stat-label { font-size: 0.75rem; color: rgba(255, 255, 255, 0.45); }

.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
}
</style>
