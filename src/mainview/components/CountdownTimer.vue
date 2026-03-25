<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  remainingSeconds: number;
  totalSeconds: number;
  phase: string;
  size?: number;
  strokeWidth?: number;
}>()

const size = computed(() => props.size ?? 200)
const strokeWidth = computed(() => props.strokeWidth ?? 10)
const radius = computed(() => (size.value - strokeWidth.value) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const progress = computed(() => {
  if (props.totalSeconds <= 0) {return 0}
  return Math.max(0, Math.min(1, 1 - props.remainingSeconds / props.totalSeconds))
})

const dashOffset = computed(() => {
  return circumference.value * (1 - progress.value)
})

const formattedTime = computed(() => {
  const s = props.remainingSeconds
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
})

const phaseLabel = computed(() => {
  switch (props.phase) {
    case 'working': return '专注工作中'
    case 'resting': return '休息中'
    case 'paused': return '已暂停'
    default: return ''
  }
})
</script>

<template>
  <div class="countdown-timer">
    <div class="circle-wrap">
      <svg
        :width="size"
        :height="size"
        class="progress-svg"
      >
        <circle
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          class="track"
          fill="none"
          :stroke-width="strokeWidth"
        />
        <circle
          :cx="size / 2"
          :cy="size / 2"
          :r="radius"
          class="progress"
          fill="none"
          :stroke-width="strokeWidth"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          stroke-linecap="round"
          :transform="`rotate(-90, ${size / 2}, ${size / 2})`"
        />
      </svg>
      <div class="time-label">
        <span class="time-text">{{ formattedTime }}</span>
        <span class="phase-label">{{ phaseLabel }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.countdown-timer {
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-svg {
  display: block;
}

.track {
  stroke: rgba(255, 255, 255, 0.15);
}

.progress {
  stroke: #4ade80;
  transition: stroke-dashoffset 0.8s ease;
}

.time-label {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.time-text {
  font-size: 2.2rem;
  font-weight: 700;
  color: white;
  letter-spacing: 2px;
  font-variant-numeric: tabular-nums;
}

.phase-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}
</style>
