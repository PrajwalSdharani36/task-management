<script setup>
import { computed } from 'vue';
import { STATUS_OPTIONS, labelFor } from '@/utils/constants';

const props = defineProps({
  status: { type: String, required: true },
});

const label = computed(() => labelFor(STATUS_OPTIONS, props.status));
</script>

<template>
  <span class="badge status" :data-status="status">
    <span class="dot" />
    {{ label }}
  </span>
</template>
