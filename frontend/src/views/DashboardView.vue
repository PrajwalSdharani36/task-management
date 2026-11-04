<script setup>
import { computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTaskStore } from '@/stores/tasks';
import { useUiStore } from '@/stores/ui';
import StatCard from '@/components/StatCard.vue';
import TaskCard from '@/components/TaskCard.vue';
import StatusDonut from '@/components/charts/StatusDonut.vue';
import PriorityBars from '@/components/charts/PriorityBars.vue';
import WorkloadChart from '@/components/charts/WorkloadChart.vue';
import { canChangeStatus } from '@/utils/permissions';

const auth = useAuthStore();
const taskStore = useTaskStore();
const ui = useUiStore();

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
});

const scopeText = computed(() => {
  if (auth.isAdmin) return 'Showing every task in the organisation.';
  if (auth.isManager) return 'Showing tasks you created and tasks assigned to you.';
  return 'Showing the tasks assigned to you.';
});

const s = computed(() => taskStore.stats);

const statusSegments = computed(() => [
  { key: 'todo', label: 'To Do', value: s.value?.todo ?? 0 },
  { key: 'in_progress', label: 'In Progress', value: s.value?.inProgress ?? 0 },
  { key: 'completed', label: 'Completed', value: s.value?.completed ?? 0 },
]);

async function onStatusChange(task, status) {
  try {
    await taskStore.updateStatus(task, status);
    ui.success('Status updated');
    taskStore.fetchStats();
  } catch (err) {
    ui.error(err.message);
  }
}

onMounted(() => taskStore.fetchStats());
</script>

<template>
  <section class="stack">
    <div class="page-head">
      <div>
        <h2>{{ greeting }}, {{ auth.user?.name?.split(' ')[0] }}</h2>
        <p class="muted">{{ scopeText }}</p>
      </div>
      <RouterLink v-if="auth.canManageTasks" to="/tasks/create" class="btn btn-primary">+ New task</RouterLink>
    </div>

    <div v-if="taskStore.error" class="alert alert-error">{{ taskStore.error }}</div>

    <div v-if="taskStore.loading && !s" class="stat-grid">
      <div v-for="n in 6" :key="n" class="stat-card skeleton" />
    </div>

    <template v-else-if="s">
      <div class="stat-grid">
        <StatCard label="Total tasks" :value="s.total" />
        <StatCard label="To do" :value="s.todo" tone="todo" />
        <StatCard label="In progress" :value="s.inProgress" tone="progress" />
        <StatCard label="Completed" :value="s.completed" tone="done" :hint="`${s.completionRate}% completion`" />
        <StatCard label="High priority open" :value="s.highPriority" tone="high" />
        <StatCard label="Overdue" :value="s.overdue" tone="danger" />
      </div>

      <div class="dash-grid">
        <div class="card">
          <h3 class="card-title">Tasks by status</h3>
          <StatusDonut :segments="statusSegments" />
        </div>

        <div class="card">
          <h3 class="card-title">Open tasks by priority</h3>
          <PriorityBars :counts="taskStore.byPriority" />
        </div>
      </div>

      <div class="dash-grid" :class="{ single: !auth.canManageTasks }">
        <div v-if="auth.canManageTasks" class="card">
          <h3 class="card-title">Workload by team member</h3>
          <WorkloadChart :rows="taskStore.workload" />
        </div>

        <div class="card">
          <div class="card-title-row">
            <h3 class="card-title">Upcoming deadlines</h3>
            <RouterLink :to="auth.canManageTasks ? '/tasks' : '/tasks/mine'" class="link-sm">View all →</RouterLink>
          </div>
          <p v-if="!taskStore.upcoming.length" class="muted">Nothing pending. Nice work!</p>
          <div v-else class="stack-sm">
            <TaskCard
              v-for="task in taskStore.upcoming"
              :key="task._id"
              :task="task"
              compact
              :can-change-status="canChangeStatus(auth.user, task)"
              @status-change="onStatusChange"
            />
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
