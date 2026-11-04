<script setup>
import { useUiStore } from '@/stores/ui';

const ui = useUiStore();
</script>

<template>
  <div class="toast-host" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="toast in ui.toasts" :key="toast.id" class="toast" :class="toast.type" @click="ui.dismiss(toast.id)">
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>
