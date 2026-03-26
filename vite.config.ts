import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { DEV_SERVER_PORT } from './src/shared/serverConfig'

export default defineConfig({
  plugins: [vue()],
  root: 'src/mainview',
  publicDir: 'public',
  define: {
    // 构建时注入平台常量，避免在渲染进程中依赖 navigator.userAgent
    __IS_WINDOWS__: JSON.stringify(process.platform === 'win32'),
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/mainview/index.html'),
        break: resolve(__dirname, 'src/mainview/break.html'),
      },
    },
  },
  server: {
    port: DEV_SERVER_PORT,
    strictPort: true,
  },
  resolve: {
    alias: {
      'electrobun/view': resolve(__dirname, 'node_modules/electrobun/dist/api/browser/index.ts'),
      // 避免 Vite 尝试解析 bun 专用模块
      'electrobun/bun': resolve(__dirname, 'src/mainview/stubs/electrobun-bun-stub.ts'),
    },
  },
})
