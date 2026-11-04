<script setup>
import { computed } from 'vue';
import { PRIORITY_OPTIONS, labelFor } from '@/utils/constants';

const props = defineProps({
  priority: { type: String, required: true },
});

const label = computed(() => labelFor(PRIORITY_OPTIONS, props.priority));
</script>

<template>
  <span class="badge priority" :data-priority="priority">{{ label }}</span>
</template>
