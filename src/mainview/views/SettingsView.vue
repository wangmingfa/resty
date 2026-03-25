<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settingsStore.ts'
import PageHeader from '../components/PageHeader.vue'

const settingsStore = useSettingsStore()
const saving = ref(false)
const saved = ref(false)

const form = reactive({
  workDuration: 20,
  breakDuration: 20,
  postponeDuration: 5,
  autoStart: false,
  autoStartWork: false,
  breakMessage: '望向远处，让眼睛休息一下',
})

onMounted(async () => {
  await settingsStore.load()
  Object.assign(form, settingsStore.settings)
})

watch(() => settingsStore.settings, (s) => {
  Object.assign(form, s)
}, { deep: true })

async function handleSave() {
  saving.value = true
  saved.value = false
  try {
    await settingsStore.save({ ...form })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="settings-view">
    <PageHeader title="设置" />

    <div
      v-if="settingsStore.loaded"
      class="settings-body"
    >
      <section class="section">
        <h3 class="section-title">
          计时设置
        </h3>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">工作时长</span>
            <span class="setting-desc">两次休息之间的工作时间</span>
          </div>
          <div class="setting-control">
            <div class="num-input-wrapper">
              <input
                v-model.number="form.workDuration"
                type="number"
                min="1"
                max="120"
                class="num-input"
              >
              <div class="num-controls">
                <button
                  class="num-btn num-btn-up"
                  @click="form.workDuration = Math.min(120, form.workDuration + 1)"
                >
                  ▲
                </button>
                <button
                  class="num-btn num-btn-down"
                  @click="form.workDuration = Math.max(1, form.workDuration - 1)"
                >
                  ▼
                </button>
              </div>
            </div>
            <span class="unit">分钟</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">休息时长</span>
            <span class="setting-desc">每次休息的持续时间</span>
          </div>
          <div class="setting-control">
            <div class="num-input-wrapper">
              <input
                v-model.number="form.breakDuration"
                type="number"
                min="5"
                max="600"
                class="num-input"
              >
              <div class="num-controls">
                <button
                  class="num-btn num-btn-up"
                  @click="form.breakDuration = Math.min(600, form.breakDuration + 1)"
                >
                  ▲
                </button>
                <button
                  class="num-btn num-btn-down"
                  @click="form.breakDuration = Math.max(5, form.breakDuration - 1)"
                >
                  ▼
                </button>
              </div>
            </div>
            <span class="unit">秒</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">推迟时长</span>
            <span class="setting-desc">点击推迟后延后的时间</span>
          </div>
          <div class="setting-control">
            <div class="num-input-wrapper">
              <input
                v-model.number="form.postponeDuration"
                type="number"
                min="1"
                max="30"
                class="num-input"
              >
              <div class="num-controls">
                <button
                  class="num-btn num-btn-up"
                  @click="form.postponeDuration = Math.min(30, form.postponeDuration + 1)"
                >
                  ▲
                </button>
                <button
                  class="num-btn num-btn-down"
                  @click="form.postponeDuration = Math.max(1, form.postponeDuration - 1)"
                >
                  ▼
                </button>
              </div>
            </div>
            <span class="unit">分钟</span>
          </div>
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">
          行为设置
        </h3>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">开机自启</span>
            <span class="setting-desc">系统启动时自动运行 Resty</span>
          </div>
          <label class="toggle">
            <input
              v-model="form.autoStart"
              type="checkbox"
            >
            <span class="slider" />
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">启动时自动开始计时</span>
            <span class="setting-desc">打开应用后立即开始工作计时</span>
          </div>
          <label class="toggle">
            <input
              v-model="form.autoStartWork"
              type="checkbox"
            >
            <span class="slider" />
          </label>
        </div>
      </section>



      <section class="section">
        <h3 class="section-title">
          提醒文案
        </h3>
        <div class="setting-item column">
          <span class="setting-desc">全屏休息时显示的提示文字</span>
          <input
            v-model="form.breakMessage"
            type="text"
            class="text-input"
            placeholder="望向远处，让眼睛休息一下"
          >
        </div>
      </section>
    </div>

    <div
      v-if="!settingsStore.loaded"
      class="loading"
    >
      加载中...
    </div>

    <!-- 固定在底部的保存按钮 -->
    <div
      v-if="settingsStore.loaded"
      class="save-bar"
    >
      <p
        v-if="saved"
        class="save-hint"
      >
        ✓ 设置已保存
      </p>
      <button
        class="btn-save"
        :disabled="saving"
        @click="handleSave"
      >
        {{ saving ? "保存中..." : "保存设置" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  height: 100%;
  background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
  color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px 8px;
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

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  margin-bottom: 8px;
}

.setting-item.column {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 0.95rem;
  font-weight: 500;
}

.setting-desc {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.4);
}



/* 数字输入框容器 */
.num-input-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* 数字输入框 */
.num-input {
  width: 80px;
  height: 40px;
  padding: 6px 30px 6px 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: textfield;
  transition: background 0.2s, border-color 0.2s;
}

.num-input:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.num-input:focus {
  border-color: #4ade80;
  background: rgba(255, 255, 255, 0.1);
}

/* 隐藏默认的上下箭头 */
.num-input::-webkit-outer-spin-button,
.num-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 自定义上下按钮容器 */
.num-controls {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 上下按钮 */
.num-btn {
  width: 20px;
  height: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
}

.num-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.num-btn:active {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(0.95);
}

.unit {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.45);
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.select-input {
  min-width: 120px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  transition: background 0.2s, border-color 0.2s;
}

.select-input:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.select-input:focus {
  border-color: #4ade80;
  background: rgba(255, 255, 255, 0.1);
}



.select-input option {
  background: #1e293b;
  color: white;
  padding: 8px;
}

.text-input {
  width: 100%;
  padding: 9px 12px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: white;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
}

.text-input:focus {
  border-color: #4ade80;
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 13px;
  cursor: pointer;
  transition: background 0.25s;
}

.slider::before {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.25s;
}

.toggle input:checked + .slider {
  background: #4ade80;
}

.toggle input:checked + .slider::before {
  transform: translateX(20px);
}

/* 固定底部保存栏 */
.save-bar {
  flex-shrink: 0;
  padding: 12px 20px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 23, 42, 0.95);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-save {
  width: 100%;
  padding: 14px;
  background: #4ade80;
  color: #0f172a;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover:not(:disabled) {
  background: #22c55e;
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-hint {
  font-size: 0.88rem;
  color: #4ade80;
  margin: 0;
  text-align: center;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
}
</style>
