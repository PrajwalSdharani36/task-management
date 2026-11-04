<script setup>
import { computed } from 'vue';
import ChartTooltip from './ChartTooltip.vue';
import { useChartTooltip } from '@/composables/useChartTooltip';

const props = defineProps({
  counts: { type: Object, required: true },
});

const { tip, show, hide } = useChartTooltip();

const rows = computed(() => {
  const list = [
    { key: 'high', label: 'High', value: props.counts.high ?? 0 },
    { key: 'medium', label: 'Medium', value: props.counts.medium ?? 0 },
    { key: 'low', label: 'Low', value: props.counts.low ?? 0 },
  ];
  const max = Math.max(...list.map((r) => r.value), 1);
  return list.map((r) => ({ ...r, width: (r.value / max) * 100 }));
});

const totalOpen = computed(() => rows.value.reduce((sum, r) => sum + r.value, 0));

function enter(event, row) {
  const share = totalOpen.value ? Math.round((row.value / totalOpen.value) * 100) : 0;
  show(event, `${row.label} priority`, [`${row.value} open task${row.value === 1 ? '' : 's'} · ${share}% of open work`]);
}
</script>

<template>
  <div class="chart bar-chart">
    <p v-if="!totalOpen" class="muted">No open tasks.</p>
    <div v-for="row in rows" v-else :key="row.key" class="bar-row" @mousemove="enter($event, row)" @mouseleave="hide">
      <span class="bar-label">{{ row.label }}</span>
      <div class="bar-track">
        <div class="bar-fill" :style="{ width: row.value ? `max(${row.width}%, 6px)` : '0' }" />
      </div>
      <span class="bar-value">{{ row.value }}</span>
    </div>
    <ChartTooltip :tip="tip" />
  </div>
</template>
