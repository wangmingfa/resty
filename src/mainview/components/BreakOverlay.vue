<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTimerStore } from '../stores/timerStore.ts'
import { useSettingsStore, rpc } from '../stores/settingsStore.ts'
import type { TimerState } from '../stores/timerStore.ts'

const timerStore = useTimerStore()
const settingsStore = useSettingsStore()

const visible = ref(false)

const formattedTime = computed(() => {
  const s = timerStore.remainingSeconds
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

onMounted(() => {
  void settingsStore.load()

  rpc.addMessageListener('timer:tick', (state: TimerState) => {
    timerStore.updateFromTick(state)
  })

  // 下一帧触发 fade-in
  requestAnimationFrame(() => {
    visible.value = true
  })
})

async function handleExit(): Promise<void> {
  visible.value = false
  await new Promise((resolve) => setTimeout(resolve, 600))
  await timerStore.exitBreak()
}
</script>

<template>
  <div
    class="break-screen"
    :class="{ visible }"
  >
    <div class="content">
      <h1 class="title">
        休息一下
      </h1>
      <p class="subtitle">
        {{ settingsStore.settings.breakMessage }}
      </p>
      <div class="divider" />
      <p class="countdown">
        {{ formattedTime }}
      </p>
      <button
        class="btn-end"
        @click="handleExit"
      >
        结束休息
      </button>
    </div>
  </div>
</template>

<style scoped>
.break-screen {
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, #2a2a2a 0%, #000 65%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.6s ease;

  &::before {
    pointer-events: none;
    content: "";
    position: absolute;
    inset: 0;

    /* 核心：径向渐变灯光 */
    background: radial-gradient(
      circle at center,
      rgba(50, 50, 50, 0.5) 0%,
      rgba(10, 10, 10, 0.15) 40%,
      rgba(0, 0, 0, 0.5) 60%,
      rgba(0, 0, 0, 0.9) 80%,
      rgba(0, 0, 0, 1) 100%
    );

    /* 柔和一点 */
    filter: blur(2px);
    z-index: -1;
  }
}

.break-screen.visible {
  opacity: 1;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.title {
  font-size: 2.6rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  letter-spacing: 1px;
}

.divider {
  width: 80px;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 6px 0;
}

.countdown {
  font-size: 2.4rem;
  font-weight: 300;
  color: #fff;
  letter-spacing: 4px;
  font-variant-numeric: tabular-nums;
  margin: 0;
}

.btn-end {
  margin-top: 32px;
  padding: 8px 28px;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.82rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-end:hover {
  border-color: rgba(255, 255, 255, 0.5);
  color: rgba(255, 255, 255, 0.75);
}
</style>
