# Resty

> 基于 **Electrobun + Bun + Vue 3 + TypeScript + Vite** 构建的桌面护眼休息提醒应用（macOS）。
> 
> 灵感来源于 [LookAway](https://github.com/GaetanOff/LookAway)，使用现代化技术栈完整重新实现其所有功能。

---

## 功能特性

### 核心功能

- **定时休息提醒**：按照设定的工作时长，周期性弹出全屏提醒，强制或温和地提示用户休息眼睛
- **20-20-20 法则支持**：每 20 分钟提醒用户注视 6 米（20 英尺）外的物体 20 秒，遵循护眼黄金法则
- **自定义工作/休息时长**：自由设置工作时间段（默认 20 分钟）和休息时长（默认 20 秒）
- **倒计时显示**：休息提醒界面实时显示剩余休息时间，进度条动态展示
- **跳过/推迟功能**：支持跳过本次休息或将提醒推迟若干分钟（可自定义推迟时长）
- **严格模式**：可选开启严格模式，禁止跳过或推迟，强制完成休息
- **系统托盘驻留**：应用最小化后驻留系统菜单栏（macOS Menu Bar），随时查看下次休息倒计时
- **开机自启动**：支持设置应用随系统启动自动运行
- **暂停 / 恢复**：随时从托盘菜单暂停或恢复提醒计时

### 界面与体验

- **全屏遮罩提醒**：休息时弹出全屏半透明覆盖层，有效阻断屏幕使用
- **柔和动画过渡**：提醒窗口淡入淡出，减少视觉突兀感
- **深色 / 浅色主题**：跟随系统外观自动切换，或手动指定主题
- **多语言支持**：中文 / English 界面切换
- **自定义提醒文案**：支持个性化休息提示语

### 统计与历史

- **今日统计**：记录今日已完成休息次数、跳过次数、总休息时长
- **历史记录**：按日期查看历史休息数据，评估用眼健康趋势

---

## 技术架构

```
resty/
├── src/
│   ├── bun/                # 主进程（Bun 运行时）
│   │   ├── index.ts        # 应用入口，窗口管理
│   │   ├── timer.ts        # 核心计时器逻辑
│   │   ├── tray.ts         # 系统托盘 Menu Bar 管理
│   │   ├── store.ts        # 持久化配置与统计数据存储
│   │   ├── autostart.ts    # 开机自启动管理
│   │   └── ipc.ts          # 主进程 IPC 消息处理
│   └── mainview/           # 渲染进程（Vue 3 + Vite）
│       ├── index.html
│       ├── main.ts         # Vue 应用挂载入口
│       ├── app.css         # 全局样式
│       ├── App.vue         # 根组件（路由容器）
│       ├── components/
│       │   ├── BreakOverlay.vue    # 全屏休息遮罩组件
│       │   ├── CountdownTimer.vue  # 倒计时 + 进度条组件
│       │   ├── TrayPopover.vue     # 托盘点击弹出面板
│       │   └── StatsCard.vue       # 统计数据卡片
│       ├── views/
│       │   ├── HomeView.vue        # 主界面（状态 + 下次提醒倒计时）
│       │   ├── SettingsView.vue    # 设置页面
│       │   └── StatsView.vue       # 统计历史页面
│       └── stores/
│           ├── timerStore.ts       # Pinia：计时器状态
│           └── settingsStore.ts    # Pinia：用户配置状态
├── electrobun.config.ts    # Electrobun 构建配置
├── vite.config.ts          # Vite 构建配置
├── tsconfig.json
└── package.json
```

### 技术选型说明

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | [Electrobun](https://electrobun.dev) | 基于 Bun 的轻量跨平台桌面框架 |
| 主进程运行时 | [Bun](https://bun.sh) | 高性能 JS/TS 运行时，替代 Node.js |
| 前端框架 | [Vue 3](https://vuejs.org) | Composition API + `<script setup>` |
| 状态管理 | [Pinia](https://pinia.vuejs.org) | Vue 3 官方推荐状态管理 |
| 构建工具 | [Vite](https://vitejs.dev) | 极速 HMR 开发体验 |
| 语言 | TypeScript | 全栈类型安全 |

---

## 开发环境要求

- macOS 12+（Sonoma 推荐）
- [Bun](https://bun.sh) >= 1.0
- Xcode Command Line Tools

---

## 快速开始

### 安装依赖

```bash
bun install
```

### 开发模式

**标准开发（无 HMR）：**
```bash
bun run dev
```

**带 Vite HMR 热更新的开发模式（推荐）：**
```bash
bun run dev:hmr
```
此命令会同时启动 Vite 开发服务器（端口 5173）和 Electrobun，渲染进程支持热模块替换，修改 Vue 组件后无需重启应用。

### 构建发布包

```bash
bun run build:canary
```

---

## 功能实现细节

### 1. 计时器核心逻辑（`src/bun/timer.ts`）

主进程中使用 `setInterval` 实现高精度计时，状态机管理工作/休息两种阶段：

```
[working] --时间到--> [break_pending] --展示遮罩--> [resting] --休息完成--> [working]
                          |
                     [跳过/推迟] --> [working / delayed]
```

- 计时器状态通过 IPC 同步至渲染进程
- 严格模式下屏蔽跳过 IPC 消息
- 应用切换到后台时计时继续运行，不受影响

### 2. 全屏休息遮罩（`BreakOverlay.vue`）

通过 Electrobun 的 `BrowserWindow` API 在休息触发时创建一个新的全屏置顶窗口：

```typescript
const breakWindow = new BrowserWindow({
  title: "Resty - Break",
  url: "views://mainview/index.html#/break",
  frame: {
    width: screenWidth,
    height: screenHeight,
    x: 0,
    y: 0,
    alwaysOnTop: true,
    fullscreen: true,
  },
});
```

遮罩组件内包含：
- 休息倒计时（大字体居中显示）
- 环形/线形进度条
- 提示文案（"望向远处，放松眼睛..."）
- 可选的跳过/推迟按钮（严格模式下隐藏）

### 3. 系统托盘（`src/bun/tray.ts`）

使用 Electrobun Tray API 在 macOS 菜单栏显示图标和动态倒计时：

```typescript
import { Tray } from "electrobun/bun";

const tray = new Tray({
  icon: "assets/tray-icon.png",
  title: "20:00", // 动态更新剩余时间
});

tray.setMenu([
  { label: "下次休息：19:32", enabled: false },
  { type: "separator" },
  { label: "暂停提醒", click: () => timer.pause() },
  { label: "立即休息", click: () => timer.triggerBreak() },
  { type: "separator" },
  { label: "设置...", click: () => openSettings() },
  { label: "退出 Resty", click: () => app.quit() },
]);
```

### 4. 持久化存储（`src/bun/store.ts`）

使用 Bun 内置文件 API 将配置和统计数据以 JSON 格式存储到 `~/Library/Application Support/Resty/`：

```typescript
// 配置项结构
interface ResthSettings {
  workDuration: number;      // 工作时长（分钟），默认 20
  breakDuration: number;     // 休息时长（秒），默认 20
  postponeDuration: number;  // 推迟时长（分钟），默认 5
  strictMode: boolean;       // 严格模式，默认 false
  autoStart: boolean;        // 开机自启，默认 false
  theme: "system" | "light" | "dark";
  language: "zh" | "en";
  breakMessage: string;      // 自定义提醒文案
}

// 每日统计结构
interface DailyStats {
  date: string;              // YYYY-MM-DD
  completedBreaks: number;   // 完成休息次数
  skippedBreaks: number;     // 跳过次数
  totalRestSeconds: number;  // 总休息秒数
}
```

### 5. IPC 通信（`src/bun/ipc.ts`）

主进程与渲染进程通过 Electrobun IPC 通信：

| 消息方向 | 事件名 | 说明 |
|---------|--------|------|
| 主→渲染 | `timer:tick` | 每秒推送剩余时间 |
| 主→渲染 | `timer:break-start` | 触发休息，携带休息时长 |
| 主→渲染 | `timer:break-end` | 休息结束，关闭遮罩 |
| 主→渲染 | `settings:updated` | 配置变更通知 |
| 渲染→主 | `break:skip` | 用户点击跳过 |
| 渲染→主 | `break:postpone` | 用户点击推迟 |
| 渲染→主 | `settings:save` | 保存新配置 |
| 渲染→主 | `timer:pause` | 暂停计时 |
| 渲染→主 | `timer:resume` | 恢复计时 |

### 6. 开机自启动（`src/bun/autostart.ts`）

通过写入 macOS LaunchAgent plist 文件实现开机自启：

```typescript
const plistPath = `${homedir()}/Library/LaunchAgents/xyz.resty.app.plist`;

async function enableAutoStart(appPath: string) {
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>xyz.resty.app</string>
  <key>ProgramArguments</key>
  <array>
    <string>${appPath}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>`;
  await Bun.write(plistPath, plist);
}
```

---

## 设置项说明

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| 工作时长 | 20 分钟 | 两次休息之间的工作时间 |
| 休息时长 | 20 秒 | 每次休息的持续时间 |
| 推迟时长 | 5 分钟 | 点击推迟后延后的时间 |
| 严格模式 | 关闭 | 开启后无法跳过或推迟休息 |
| 开机自启 | 关闭 | 系统启动时自动运行 |
| 主题 | 跟随系统 | system / light / dark |
| 语言 | 中文 | zh / en |
| 提醒文案 | "望向远处，让眼睛休息一下" | 自定义全屏提醒文字 |

---

## 开发脚本

| 命令 | 说明 |
|------|------|
| `bun run dev` | 标准开发模式 |
| `bun run dev:hmr` | 带 HMR 的开发模式（同时启动 Vite + Electrobun） |
| `bun run start` | 构建前端后启动 Electrobun dev |
| `bun run hmr` | 仅启动 Vite HMR 服务器（端口 5173） |
| `bun run build:canary` | 构建 canary 发布包 |

---

## 与 LookAway 的对比

| 功能 | LookAway | Resty |
|------|----------|-------|
| 定时休息提醒 | ✅ | ✅ |
| 20-20-20 法则 | ✅ | ✅ |
| 自定义工作/休息时长 | ✅ | ✅ |
| 跳过 / 推迟 | ✅ | ✅ |
| 严格模式 | ✅ | ✅ |
| 系统托盘 | ✅ | ✅ |
| 开机自启 | ✅ | ✅ |
| 全屏遮罩 | ✅ | ✅ |
| 休息统计 | ✅ | ✅ |
| 深色模式 | ✅ | ✅ |
| 技术栈 | Java/JavaFX | Electrobun + Vue 3 + Bun |
| 包体积 | 较大 | 更小 |
| 启动速度 | 较慢 | 更快（Bun 运行时） |

---

## License

MIT
