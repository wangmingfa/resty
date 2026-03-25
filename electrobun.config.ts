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
    },
    // Ignore Vite output in watch mode — HMR handles view rebuilds separately
    watchIgnore: ['dist/**'],
    mac: {
      bundleCEF: false,
      icons: 'icon.iconset',
    },
    linux: { bundleCEF: false },
    win: { bundleCEF: false },
  },
  runtime: { exitOnLastWindowClosed: false },
} satisfies ElectrobunConfig
