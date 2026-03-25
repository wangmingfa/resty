<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { rpc } from '../stores/settingsStore.ts'
import PageHeader from '../components/PageHeader.vue'

interface DailyStats {
  date: string;
  completedBreaks: number;
  skippedBreaks: number;
  totalRestSeconds: number;
}

const todayStats = ref<DailyStats>({
  date: '',
  completedBreaks: 0,
  skippedBreaks: 0,
  totalRestSeconds: 0,
})

const allHistory = ref<DailyStats[]>([])

const recentHistory = computed(() => {
  return [...allHistory.value]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
})

const formattedTodayRest = computed(() => formatDuration(todayStats.value.totalRestSeconds))

const healthScore = computed(() => {
  const total = todayStats.value.completedBreaks + todayStats.value.skippedBreaks
  if (total === 0) {return 0}
  const rate = todayStats.value.completedBreaks / total
  return Math.round(rate * 100)
})

const scoreColor = computed(() => {
  if (healthScore.value >= 80) {return '#4ade80'}
  if (healthScore.value >= 50) {return '#fbbf24'}
  return '#f87171'
})

const scoreText = computed(() => {
  if (healthScore.value >= 80) {return '棒极了！你的用眼习惯很健康 🎉'}
  if (healthScore.value >= 50) {return '还不错，继续保持休息习惯 💪'}
  if (healthScore.value > 0) {return '注意保护眼睛，减少跳过次数 👁️'}
  return '今天还没有休息记录'
})

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (dateStr === today.toISOString().slice(0, 10)) {return '今天'}
  if (dateStr === yesterday.toISOString().slice(0, 10)) {return '昨天'}

  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) { return `${String(seconds)}秒` }
  const m = Math.floor(seconds / 60)
  return `${String(m)}分钟`
}

function getCompletionRate(item: DailyStats): number {
  const total = item.completedBreaks + item.skippedBreaks
  if (total === 0) {return 0}
  return Math.round((item.completedBreaks / total) * 100)
}

function getBarColor(item: DailyStats): string {
  const rate = getCompletionRate(item)
  if (rate >= 80) {return '#4ade80'}
  if (rate >= 50) {return '#fbbf24'}
  return '#f87171'
}

onMounted(() => {
  void (async () => {
    try {
      todayStats.value = await rpc.request['stats:today']({})

      allHistory.value = await rpc.request['stats:history']({})
    } catch (e) {
      console.error('Failed to load stats:', e)
    }
  })()
})
</script>

<template>
  <div class="stats-view">
    <PageHeader title="统计" />

    <div class="stats-body">
      <!-- 今日统计 -->
      <section class="section">
        <h3 class="section-title">
          今日概览
        </h3>
        <div class="today-cards">
          <div class="stat-card green">
            <span class="card-value">{{ todayStats.completedBreaks }}</span>
            <span class="card-label">完成休息</span>
          </div>
          <div class="stat-card yellow">
            <span class="card-value">{{ todayStats.skippedBreaks }}</span>
            <span class="card-label">跳过次数</span>
          </div>
          <div class="stat-card blue">
            <span class="card-value">{{ formattedTodayRest }}</span>
            <span class="card-label">总休息时长</span>
          </div>
        </div>
      </section>

      <!-- 健康评分 -->
      <section class="section">
        <h3 class="section-title">
          今日健康评分
        </h3>
        <div class="health-score-card">
          <div
            class="score-circle"
            :style="{ '--score-color': scoreColor }"
          >
            <span class="score-value">{{ healthScore }}</span>
            <span class="score-unit">分</span>
          </div>
          <div class="score-desc">
            <p class="score-text">
              {{ scoreText }}
            </p>
            <p class="score-hint">
              基于今日休息完成率计算
            </p>
          </div>
        </div>
      </section>

      <!-- 历史记录 -->
      <section class="section">
        <h3 class="section-title">
          历史记录（近 7 天）
        </h3>
        <div
          v-if="recentHistory.length > 0"
          class="history-list"
        >
          <div
            v-for="item in recentHistory"
            :key="item.date"
            class="history-item"
          >
            <div class="history-date">
              <span class="date-main">{{ formatDate(item.date) }}</span>
              <span class="date-sub">{{ item.date }}</span>
            </div>
            <div class="history-stats">
              <span class="hs-item completed">✓ {{ item.completedBreaks }}</span>
              <span class="hs-item skipped">✕ {{ item.skippedBreaks }}</span>
              <span class="hs-item duration">{{ formatDuration(item.totalRestSeconds) }}</span>
            </div>
            <div class="history-bar">
              <div
                class="bar-fill"
                :style="{
                  width: `${getCompletionRate(item)}%`,
                  background: getBarColor(item),
                }"
              />
            </div>
          </div>
        </div>
        <div
          v-else
          class="empty-hint"
        >
          暂无历史记录
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="less">
.stats-view {
  height: 100%;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
  color: white;
  display: flex;
  flex-direction: column;
}

.stats-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 20px 32px;
}

.section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0 0 12px;
}

.today-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border-radius: 12px;
  gap: 6px;
}

.stat-card.green {
  background: rgba(74, 222, 128, 0.12);
  border: 1px solid rgba(74, 222, 128, 0.2);
}

.stat-card.yellow {
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.stat-card.blue {
  background: rgba(96, 165, 250, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.2);
}

.card-value {
  font-size: 1.8rem;
  font-weight: 700;
}

.stat-card.green .card-value { color: #4ade80; }
.stat-card.yellow .card-value { color: #fbbf24; }
.stat-card.blue .card-value { color: #60a5fa; }

.card-label {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
}

/* Health Score */
.health-score-card {
  display: flex;
  align-items: center;
  gap: 24px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px 24px;
}

.score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--score-color, #4ade80);
  flex-shrink: 0;
}

.score-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--score-color, #4ade80);
  line-height: 1;
}

.score-unit {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

.score-text {
  font-size: 0.9rem;
  color: white;
  margin: 0 0 4px;
}

.score-hint {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
}

/* History */
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 8px 12px;
  align-items: center;
}

.history-date {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-main {
  font-size: 0.9rem;
  font-weight: 500;
}

.date-sub {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.35);
}

.history-stats {
  display: flex;
  gap: 10px;
  align-items: center;
}

.hs-item {
  font-size: 0.78rem;
  padding: 2px 8px;
  border-radius: 6px;
}

.hs-item.completed {
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
}

.hs-item.skipped {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
}

.hs-item.duration {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.5);
}

.history-bar {
  grid-column: 1 / -1;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

.empty-hint {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 32px;
  font-size: 0.9rem;
}
</style>
