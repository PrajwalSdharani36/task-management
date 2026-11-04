import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

let nextId = 1;
const THEME_KEY = 'tm_theme';

function initialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref([]);
  const sidebarOpen = ref(false);
  const theme = ref(initialTheme());

  watch(
    theme,
    (value) => {
      document.documentElement.dataset.theme = value;
      localStorage.setItem(THEME_KEY, value);
    },
    { immediate: true }
  );

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  }

  function notify(message, type = 'success', timeout = 3500) {
    const id = nextId++;
    toasts.value.push({ id, message, type });
    setTimeout(() => dismiss(id), timeout);
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  return {
    toasts,
    sidebarOpen,
    theme,
    toggleTheme,
    notify,
    success: (msg) => notify(msg, 'success'),
    error: (msg) => notify(msg, 'error', 5000),
    info: (msg) => notify(msg, 'info'),
    dismiss,
  };
});
