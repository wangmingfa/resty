<script setup lang="ts">
import BreakOverlay from './components/BreakOverlay.vue'
import { onMounted } from 'vue'
import { rpc } from './stores/settingsStore.ts'
onMounted(async () => {
  await new Promise((resolve) => setTimeout(resolve, 100))
  await rpc.request['window:show']({})
})
</script>

<template>
  <BreakOverlay />
</template>