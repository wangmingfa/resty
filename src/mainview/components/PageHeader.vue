<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="header">
    <button
      class="back-btn"
      @click="$router.push('/')"
    >
      ← 返回
    </button>
    <h2 class="title">
      {{ title }}
    </h2>
    <div />
  </div>
</template>

<style scoped lang="less">
@headerPaddingLeft: 20px;
.header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px @headerPaddingLeft;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.back-btn {
  position: absolute;
  left: @headerPaddingLeft;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
}

.back-btn:hover { color: white; }

.title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}
</style>