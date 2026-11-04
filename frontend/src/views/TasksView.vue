<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useTaskStore } from '@/stores/tasks';
import { useUiStore } from '@/stores/ui';
import { useDebouncedRef } from '@/composables/useDebouncedRef';
import TaskCard from '@/components/TaskCard.vue';
import TaskTable from '@/components/TaskTable.vue';
import KanbanBoard from '@/components/KanbanBoard.vue';
import { PRIORITY_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS } from '@/utils/constants';
import { canChangeStatus, canDeleteTask } from '@/utils/permissions';

const props = defineProps({
  mine: { type: Boolean, default: false },
});

const auth = useAuthStore();
const taskStore = useTaskStore();
const ui = useUiStore();

const VIEW_KEY = 'tm_task_view';
const view = ref(localStorage.getItem(VIEW_KEY) || 'grid');
const isBoard = computed(() => view.value === 'board');
const pageSize = () => (isBoard.value ? 100 : 12);

const search = useDebouncedRef('', 400);
taskStore.resetFilters();
const filters = taskStore.filters;
filters.limit = pageSize();

const showAssigneeFilter = computed(() => auth.canManageTasks && !props.mine);
const hasActiveFilters = computed(() => Boolean(filters.search || filters.status || filters.priority || filters.assignedTo));
const heading = computed(() => {
  if (props.mine || !auth.canManageTasks) return 'Tasks assigned to me';
  return auth.isAdmin ? 'All tasks in the organisation' : 'Tasks I created or was assigned';
});

const load = () => taskStore.fetchTasks({ mine: props.mine });

watch(search, (value) => {
  filters.search = value;
});

watch(
  () => [filters.search, filters.status, filters.priority, filters.assignedTo, filters.sort],
  () => {
    if (filters.page !== 1) filters.page = 1;
    else load();
  }
);

watch(() => filters.page, load);

watch(view, (value) => {
  localStorage.setItem(VIEW_KEY, value);
  if (filters.limit === pageSize()) return;
  filters.limit = pageSize();
  if (isBoard.value) filters.status = '';
  if (filters.page !== 1) filters.page = 1;
  else load();
});

function clearFilters() {
  taskStore.resetFilters();
  filters.limit = pageSize();
  search.value = '';
}

function goToPage(page) {
  if (page >= 1 && page <= taskStore.pagination.pages) filters.page = page;
}

async function onStatusChange(task, status) {
  try {
    await taskStore.updateStatus(task, status);
    ui.success(`Moved "${task.title}" to ${STATUS_OPTIONS.find((o) => o.value === status).label}`);
  } catch (err) {
    ui.error(err.message);
  }
}

async function onDelete(task) {
  if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
  try {
    ui.success(await taskStore.deleteTask(task._id));
    load();
  } catch (err) {
    ui.error(err.message);
  }
}

onMounted(() => {
  if (showAssigneeFilter.value && !taskStore.assignees.length) {
    taskStore.fetchAssignees().catch(() => {});
  }
  load();
});
</script>

<template>
  <section class="stack">
    <div class="page-head">
      <div>
        <h2>{{ heading }}</h2>
        <p class="muted">{{ taskStore.pagination.total }} task{{ taskStore.pagination.total === 1 ? '' : 's' }} found</p>
      </div>
      <div class="row">
        <div class="segmented compact" role="group" aria-label="View mode">
          <label :class="{ selected: view === 'grid' }"><input v-model="view" type="radio" value="grid" />Cards</label>
          <label :class="{ selected: view === 'table' }"><input v-model="view" type="radio" value="table" />Table</label>
          <label :class="{ selected: view === 'board' }"><input v-model="view" type="radio" value="board" />Board</label>
        </div>
        <RouterLink v-if="auth.canManageTasks" to="/tasks/create" class="btn btn-primary">+ New task</RouterLink>
      </div>
    </div>

    <div class="card filter-bar">
      <input v-model="search" class="input" type="search" placeholder="Search by title…" aria-label="Search tasks" />
      <select v-if="!isBoard" v-model="filters.status" class="input" aria-label="Filter by status">
        <option value="">All statuses</option>
        <option v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-model="filters.priority" class="input" aria-label="Filter by priority">
        <option value="">All priorities</option>
        <option v-for="o in PRIORITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <select v-if="showAssigneeFilter" v-model="filters.assignedTo" class="input" aria-label="Filter by assignee">
        <option value="">Anyone</option>
        <option v-for="u in taskStore.assignees" :key="u._id" :value="u._id">{{ u.name }}</option>
      </select>
      <select v-model="filters.sort" class="input" aria-label="Sort tasks">
        <option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <button v-if="hasActiveFilters" class="btn btn-ghost" @click="clearFilters">Clear</button>
    </div>

    <div v-if="taskStore.error" class="alert alert-error">
      {{ taskStore.error }}
      <button class="btn btn-ghost btn-sm" @click="load">Retry</button>
    </div>

    <div v-else-if="taskStore.loading && !taskStore.tasks.length" class="task-grid">
      <div v-for="n in 6" :key="n" class="task-card skeleton" />
    </div>

    <div v-else-if="!taskStore.tasks.length" class="empty">
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
      <h3>No tasks here</h3>
      <p class="muted">{{ hasActiveFilters ? 'Try changing or clearing the filters.' : 'When tasks are assigned they will show up here.' }}</p>
    </div>

    <template v-else>
      <KanbanBoard
        v-if="isBoard"
        :class="{ dim: taskStore.loading }"
        :tasks="taskStore.tasks"
        :can-move="(t) => canChangeStatus(auth.user, t)"
        @move="onStatusChange"
      />
      <div v-else-if="view === 'grid'" class="task-grid" :class="{ dim: taskStore.loading }">
        <TaskCard
          v-for="task in taskStore.tasks"
          :key="task._id"
          :task="task"
          :can-change-status="canChangeStatus(auth.user, task)"
          @status-change="onStatusChange"
        />
      </div>
      <TaskTable
        v-else
        :class="{ dim: taskStore.loading }"
        :tasks="taskStore.tasks"
        :can-change-status="(t) => canChangeStatus(auth.user, t)"
        :can-delete="(t) => canDeleteTask(auth.user, t)"
        @status-change="onStatusChange"
        @delete="onDelete"
      />

      <nav v-if="!isBoard && taskStore.pagination.pages > 1" class="pager">
        <button class="btn btn-ghost btn-sm" :disabled="filters.page <= 1" @click="goToPage(filters.page - 1)">← Prev</button>
        <span class="muted">Page {{ taskStore.pagination.page }} of {{ taskStore.pagination.pages }}</span>
        <button class="btn btn-ghost btn-sm" :disabled="filters.page >= taskStore.pagination.pages" @click="goToPage(filters.page + 1)">Next →</button>
      </nav>
    </template>
  </section>
</template>
