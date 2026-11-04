<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppNavbar from '@/components/AppNavbar.vue';
import AppSidebar from '@/components/AppSidebar.vue';
import ToastHost from '@/components/ToastHost.vue';
import { useUiStore } from '@/stores/ui';

const route = useRoute();
const ui = useUiStore();
const isBlank = computed(() => route.meta.layout === 'blank');
</script>

<template>
  <RouterView v-if="isBlank" />

  <div v-else class="shell">
    <AppSidebar />
    <div v-if="ui.sidebarOpen" class="scrim" @click="ui.sidebarOpen = false" />
    <div class="shell-main">
      <AppNavbar />
      <main class="page">
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" :key="r.fullPath" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>

  <ToastHost />
</template>
