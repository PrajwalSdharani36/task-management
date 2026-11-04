<script setup>
import { ref } from 'vue';

const model = defineModel({ type: String, default: '' });

defineProps({
  id: { type: String, required: true },
  autocomplete: { type: String, default: 'current-password' },
  placeholder: { type: String, default: '' },
});

const visible = ref(false);
</script>

<template>
  <div class="password-field">
    <input
      :id="id"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      class="input"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
    />
    <button
      type="button"
      class="eye-btn"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      :title="visible ? 'Hide password' : 'Show password'"
      @click="visible = !visible"
    >
      <svg v-if="visible" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-0.4 1-1.3 2.5-2.7 3.8M6.2 6.2C4.2 7.6 2.7 9.6 2 12c1 2.5 5 7 10 7 1.7 0 3.3-.5 4.6-1.3" />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  </div>
</template>
