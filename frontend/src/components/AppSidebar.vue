<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';

const auth = useAuthStore();
const ui = useUiStore();

const links = computed(() =>
  [
    { to: '/dashboard', label: 'Dashboard', icon: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
    {
      to: '/tasks/mine',
      label: 'My Tasks',
      icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
      roles: ['manager', 'employee'],
    },
    {
      to: '/tasks',
      label: auth.isAdmin ? 'All Tasks' : 'Team Tasks',
      icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
      exact: true,
      roles: ['admin', 'manager'],
    },
    { to: '/tasks/create', label: 'Create Task', icon: 'M12 5v14M5 12h14', roles: ['admin', 'manager'] },
    { to: '/admin/users', label: 'Users', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', roles: ['admin'] },
    { to: '/profile', label: 'Profile', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
  ].filter((link) => !link.roles || link.roles.includes(auth.role))
);
</script>

<template>
  <aside class="sidebar" :class="{ open: ui.sidebarOpen }">
    <RouterLink to="/dashboard" class="brand">
      <span class="brand-mark">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </span>
      <span>TaskFlow</span>
    </RouterLink>

    <nav class="nav">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="nav-link"
        :exact-active-class="link.exact ? 'active' : ''"
        :active-class="link.exact ? '' : 'active'"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path :d="link.icon" />
        </svg>
        {{ link.label }}
      </RouterLink>
    </nav>

    <div class="sidebar-foot">
      <span class="role-pill" :data-role="auth.role">{{ auth.role }}</span>
      <small>Team 6 · Mini Project</small>
    </div>
  </aside>
</template>
