/// <reference types="vite/client" />

declare module '*.vue' {
 import type { DefineComponent } from 'vue'
 const component: DefineComponent<object, object, unknown>
 export default component
}

// Vite define 注入的平台常量
declare const __IS_WINDOWS__: boolean
