
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { router } from './router'
import { rpc } from './stores/settingsStore.ts'

// 平台常量由 Vite define 在构建时注入（process.platform === 'win32'）
const isWindows = __IS_WINDOWS__

// 首次加载标记（用于跳过初始路由动画）
const isFirstLoad = ref(true)

// 窗口焦点状态
const isWindowFocused = ref(true)

// 监听路由变化，首次加载后启用动画
void router.isReady().then(() => {
  router.afterEach(() => {
    isFirstLoad.value = false
  })
})

// 监听主进程发来的导航指令（如托盘菜单「设置...」）
rpc.addMessageListener('app:navigate', ({ path }) => {
  void router.push(path)
})

// 窗口焦点事件监听
function handleFocus(): void {
  isWindowFocused.value = true
}

function handleBlur(): void {
  isWindowFocused.value = false
}

onMounted(() => {
  window.addEventListener('focus', handleFocus)
  window.addEventListener('blur', handleBlur)
  // 初始化焦点状态
  isWindowFocused.value = document.hasFocus()
})

onUnmounted(() => {
  window.removeEventListener('focus', handleFocus)
  window.removeEventListener('blur', handleBlur)
})

// 窗口控制
function closeWindow(): void {
  void rpc.request['window:hide']({})
}
</script>

<template>
  <div class="app-container">
    <!-- 全局标题栏 -->
    <header
      class="global-header electrobun-webkit-app-region-drag"
      :class="{ 'is-windows': isWindows }"
    >
      <!-- macOS：红绿灯按钮 -->
      <div
        v-if="!isWindows"
        class="traffic-lights electrobun-webkit-app-region-no-drag"
        :class="{ unfocused: !isWindowFocused }"
      >
        <button
          class="tl-btn tl-close"
          title="关闭"
          @click="closeWindow"
        >
          <svg
            class="tl-icon"
            width="6"
            height="6"
            viewBox="0 0 6 6"
          >
            <path
              d="M0.5 0.5 L5.5 5.5 M5.5 0.5 L0.5 5.5"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="logo">
        <span class="logo-icon">👁️</span>
        <span class="logo-text">Resty</span>
      </div>

      <nav class="nav electrobun-webkit-app-region-no-drag">
        <button
          class="nav-btn"
          @click="router.push('/stats')"
        >
          统计
        </button>
        <button
          class="nav-btn"
          @click="router.push('/settings')"
        >
          设置
        </button>
      </nav>

      <!-- Windows：关闭按钮（右上角），与导航按钮之间加间距 -->
      <button
        v-if="isWindows"
        class="win-close electrobun-webkit-app-region-no-drag"
        title="Hide"
        @click="closeWindow"
      >
        ✕
      </button>
    </header>

    <!-- 路由视图 -->
    <main class="app-main">
      <RouterView v-slot="{ Component, route }">
        <Transition
          :name="isFirstLoad ? '' : (route.meta.transition as string || 'slide')"
          mode="out-in"
        >
          <component
            :is="Component"
            :key="route.path"
          />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.global-header {
  height: 36px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  &.is-windows {
    padding: 0 0 0 16px;
  }
}

/* ── macOS 红绿灯 ── */
.traffic-lights {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;
}

.tl-btn {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.tl-close {
  background: #ff5f57;
  transition: background 0.2s ease;
}

/* 窗口失焦时变灰 */
.traffic-lights.unfocused .tl-close {
    background: #dbdbdb;
}

.traffic-lights.unfocused .tl-btn:hover {
    filter: none;
}

.traffic-lights.unfocused .tl-btn:hover .tl-icon {
    opacity: 0;
}

/* SVG 图标默认隐藏，hover 时显示 */
.tl-icon {
    position: absolute;
    color: rgba(89, 40, 27, 0.85);
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
}

.tl-btn:hover {
    filter: brightness(0.92);
}

.tl-btn:hover .tl-icon {
    opacity: 1;
}

/* ── Logo ── */
.logo {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.logo-icon {
    font-size: 0.8rem;
}

.logo-text {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 1px;
    color: #4ade80;
}

/* ── 导航 ── */
.nav {
    display: flex;
    gap: 8px;
    align-items: center;
}

.nav-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.75);
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 0.6rem;
    cursor: pointer;
    transition: all 0.2s;
}

.nav-btn:hover {
    background: rgba(255, 255, 255, 0.14);
    color: white;
}

/* ── Windows 关闭按钮 ── */
.win-close {
    width: 46px;
    height: 36px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.7rem;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 12px;
}

.win-close:hover {
    background: #e81123;
    color: white;
}

/* ── 主内容区 ── */
.app-main {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

/* ── 路由切换动画 ── */
.slide-enter-active,
.slide-leave-active {
    transition: transform 0.15s ease, opacity 0.15s ease;
}

.slide-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.slide-enter-to {
    transform: translateX(0);
    opacity: 1;
}

.slide-leave-from {
    transform: translateX(0);
    opacity: 1;
}

.slide-leave-to {
    transform: translateX(-30%);
    opacity: 0;
}
</style>