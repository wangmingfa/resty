import type { ElectrobunConfig } from 'electrobun'

export default {
  app: {
    name: 'Resty',
    identifier: 'xyz.resty.app',
    version: '1.0.0',
  },
  build: {
    // Vite builds to dist/, we copy from there
    copy: {
      'dist/index.html': 'views/mainview/index.html',
      'dist/break.html': 'views/mainview/break.html',
      'dist/assets': 'views/mainview/assets',
      'dist/tray-icon.png': 'views/mainview/tray-icon.png',
      'dist/tray-icon.ico': 'views/mainview/tray-icon.ico',
    },
    // Ignore Vite output in watch mode — HMR handles view rebuilds separately
    watchIgnore: ['dist/**'],
    mac: {
      bundleCEF: false,
      icons: 'icon.iconset',
    },
    linux: { bundleCEF: false },
    win: {
      bundleCEF: false,
      // Windows 任务栏/快捷方式图标（ICO 格式，含多尺寸）
      icon: 'icon.ico',
    },
  },
  runtime: { exitOnLastWindowClosed: false },
} satisfies ElectrobunConfig
