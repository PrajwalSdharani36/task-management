<script setup>
defineProps({
  tip: { type: Object, required: true },
});
</script>

<template>
  <div v-show="tip.visible" class="chart-tip" :style="{ left: `${tip.x}px`, top: `${tip.y}px` }" role="status">
    <strong>{{ tip.title }}</strong>
    <span v-for="line in tip.lines" :key="line">{{ line }}</span>
  </div>
</template>
