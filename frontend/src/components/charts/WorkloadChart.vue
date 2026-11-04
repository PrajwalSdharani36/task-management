<script setup>
import { computed } from 'vue';
import ChartTooltip from './ChartTooltip.vue';
import { useChartTooltip } from '@/composables/useChartTooltip';
import { STATUS_OPTIONS } from '@/utils/constants';

const props = defineProps({
  rows: { type: Array, required: true },
});

const FIELDS = { todo: 'todo', in_progress: 'inProgress', completed: 'completed' };

const { tip, show, hide } = useChartTooltip();

const max = computed(() => Math.max(...props.rows.map((r) => r.total), 1));

const bars = computed(() =>
  props.rows.map((row) => ({
    ...row,
    width: (row.total / max.value) * 100,
    parts: STATUS_OPTIONS.map((opt) => ({ key: opt.value, label: opt.label, value: row[FIELDS[opt.value]] })).filter((p) => p.value > 0),
  }))
);

function enter(event, row, part) {
  show(event, row.name, [
    `${part.label}: ${part.value}`,
    `${row.completed} of ${row.total} completed`,
  ]);
}
</script>

<template>
  <div class="chart workload-chart">
    <ul class="chart-legend inline">
      <li v-for="opt in STATUS_OPTIONS" :key="opt.value">
        <span class="swatch" :data-status="opt.value" />
        <span class="legend-label">{{ opt.label }}</span>
      </li>
    </ul>

    <p v-if="!rows.length" class="muted">No assigned tasks yet.</p>

    <div v-for="row in bars" :key="row.userId" class="bar-row">
      <span class="bar-label" :title="row.name">{{ row.name }}</span>
      <div class="bar-track">
        <div class="stack-bar" :style="{ width: `${row.width}%` }">
          <span
            v-for="part in row.parts"
            :key="part.key"
            class="stack-part"
            :data-status="part.key"
            :style="{ flexGrow: part.value }"
            @mousemove="enter($event, row, part)"
            @mouseleave="hide"
          />
        </div>
      </div>
      <span class="bar-value">{{ row.total }}</span>
    </div>

    <ChartTooltip :tip="tip" />
  </div>
</template>
