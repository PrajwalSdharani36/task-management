<script setup>
import { computed, ref } from 'vue';
import ChartTooltip from './ChartTooltip.vue';
import { useChartTooltip } from '@/composables/useChartTooltip';

const props = defineProps({
  segments: { type: Array, required: true },
});

const SIZE = 180;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

const { tip, show, hide } = useChartTooltip();
const active = ref(null);

const total = computed(() => props.segments.reduce((sum, s) => sum + s.value, 0));

const arcs = computed(() => {
  const visible = props.segments.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? GAP : 0;
  let offset = 0;
  return visible.map((s) => {
    const full = (s.value / total.value) * CIRCUMFERENCE;
    const length = Math.max(full - gap, 1);
    const arc = { ...s, dash: `${length} ${CIRCUMFERENCE - length}`, offset: -offset };
    offset += full;
    return arc;
  });
});

const pct = (value) => (total.value ? Math.round((value / total.value) * 100) : 0);

function enter(event, segment) {
  active.value = segment.key;
  show(event, segment.label, [`${segment.value} task${segment.value === 1 ? '' : 's'} · ${pct(segment.value)}%`]);
}

function leave() {
  active.value = null;
  hide();
}
</script>

<template>
  <div class="chart donut-chart">
    <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="donut-svg" role="img" :aria-label="`Task status: ${segments.map((s) => `${s.label} ${s.value}`).join(', ')}`">
      <g :transform="`rotate(-90 ${SIZE / 2} ${SIZE / 2})`">
        <circle :cx="SIZE / 2" :cy="SIZE / 2" :r="RADIUS" class="donut-track" :stroke-width="STROKE" fill="none" />
        <circle
          v-for="arc in arcs"
          :key="arc.key"
          :cx="SIZE / 2"
          :cy="SIZE / 2"
          :r="RADIUS"
          fill="none"
          :stroke-width="active === arc.key ? STROKE + 4 : STROKE"
          :stroke-dasharray="arc.dash"
          :stroke-dashoffset="arc.offset"
          class="donut-arc"
          :data-status="arc.key"
          :class="{ faded: active && active !== arc.key }"
          @mousemove="enter($event, arc)"
          @mouseleave="leave"
        />
      </g>
      <text :x="SIZE / 2" :y="SIZE / 2 - 4" text-anchor="middle" class="donut-total">{{ total }}</text>
      <text :x="SIZE / 2" :y="SIZE / 2 + 18" text-anchor="middle" class="donut-caption">{{ total === 1 ? 'task' : 'tasks' }}</text>
    </svg>

    <ul class="chart-legend">
      <li
        v-for="s in segments"
        :key="s.key"
        :class="{ faded: active && active !== s.key }"
        @mouseenter="active = s.key"
        @mouseleave="active = null"
      >
        <span class="swatch" :data-status="s.key" />
        <span class="legend-label">{{ s.label }}</span>
        <strong>{{ s.value }}</strong>
        <span class="muted">{{ pct(s.value) }}%</span>
      </li>
    </ul>

    <ChartTooltip :tip="tip" />
  </div>
</template>
