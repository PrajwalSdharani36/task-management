<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { useFormat } from '@/composables/useFormat';
import ThemeToggle from './ThemeToggle.vue';

const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();
const router = useRouter();
const { initials } = useFormat();

const title = computed(() => route.meta.title || '');

function logout() {
  auth.logout();
  ui.info('You have been logged out');
  router.push({ name: 'login' });
}
</script>

<template>
  <header class="navbar">
    <button class="icon-btn menu-btn" aria-label="Open menu" @click="ui.sidebarOpen = !ui.sidebarOpen">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    </button>
    <h1 class="navbar-title">{{ title }}</h1>

    <div class="navbar-right">
      <ThemeToggle />
      <RouterLink to="/profile" class="user-chip">
        <span class="avatar">{{ initials(auth.user?.name) }}</span>
        <span class="user-meta">
          <strong>{{ auth.user?.name }}</strong>
          <small>{{ auth.user?.email }}</small>
        </span>
      </RouterLink>
      <button class="btn btn-ghost" @click="logout">Log out</button>
    </div>
  </header>
</template>
