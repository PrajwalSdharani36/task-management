<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [Number, String], required: true },
  tone: { type: String, default: 'default' },
  hint: { type: String, default: '' },
});
</script>

<template>
  <div class="stat-card" :data-tone="tone">
    <span class="stat-label">{{ label }}</span>
    <span class="stat-value">{{ value }}</span>
    <span v-if="hint" class="stat-hint">{{ hint }}</span>
  </div>
</template>
