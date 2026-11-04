<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useTaskStore } from '@/stores/tasks';
import { useUiStore } from '@/stores/ui';
import { useFormat } from '@/composables/useFormat';
import StatusBadge from '@/components/StatusBadge.vue';
import PriorityBadge from '@/components/PriorityBadge.vue';
import TaskActivity from '@/components/TaskActivity.vue';
import { STATUS_OPTIONS } from '@/utils/constants';
import { canChangeStatus, canDeleteTask, canEditTask } from '@/utils/permissions';

const props = defineProps({
  id: { type: String, required: true },
});

const auth = useAuthStore();
const taskStore = useTaskStore();
const ui = useUiStore();
const router = useRouter();
const { formatDate, formatDateTime, dueLabel, initials } = useFormat();

const updating = ref(false);
const activity = ref(null);
const task = computed(() => taskStore.currentTask);
const overdue = computed(() => task.value && task.value.status !== 'completed' && new Date(task.value.dueDate) < new Date());

const permissions = computed(() => ({
  edit: canEditTask(auth.user, task.value),
  status: canChangeStatus(auth.user, task.value),
  remove: canDeleteTask(auth.user, task.value),
}));

const stepIndex = computed(() => STATUS_OPTIONS.findIndex((o) => o.value === task.value?.status));

async function setStatus(status) {
  if (status === task.value.status || updating.value) return;
  updating.value = true;
  try {
    await taskStore.updateStatus(task.value, status);
    ui.success('Status updated');
    activity.value?.reload();
  } catch (err) {
    ui.error(err.message);
  } finally {
    updating.value = false;
  }
}

async function remove() {
  if (!window.confirm(`Delete "${task.value.title}"? This cannot be undone.`)) return;
  try {
    ui.success(await taskStore.deleteTask(task.value._id));
    router.push('/tasks');
  } catch (err) {
    ui.error(err.message);
  }
}

onMounted(() => taskStore.fetchTask(props.id));
</script>

<template>
  <section class="stack">
    <RouterLink to="/tasks" class="link-sm">← Back to tasks</RouterLink>

    <div v-if="taskStore.loading" class="card skeleton tall" />

    <div v-else-if="taskStore.error" class="empty">
      <h3>{{ taskStore.error }}</h3>
      <p class="muted">The task may have been deleted, or you might not have access to it.</p>
      <RouterLink to="/tasks" class="btn btn-ghost">Go to tasks</RouterLink>
    </div>

    <template v-else-if="task">
      <div class="page-head">
        <div>
          <div class="row">
            <PriorityBadge :priority="task.priority" />
            <StatusBadge :status="task.status" />
            <span v-if="overdue" class="badge danger">Overdue</span>
          </div>
          <h2 class="detail-title">{{ task.title }}</h2>
        </div>
        <div class="row">
          <RouterLink v-if="permissions.edit" :to="`/tasks/${task._id}/edit`" class="btn btn-ghost">Edit</RouterLink>
          <button v-if="permissions.remove" class="btn btn-danger" @click="remove">Delete</button>
        </div>
      </div>

      <div class="detail-grid">
        <div class="stack">
          <div class="card">
            <h3 class="card-title">Description</h3>
            <p class="prewrap">{{ task.description || 'No description provided.' }}</p>
          </div>

          <div class="card">
            <h3 class="card-title">Progress</h3>
            <ol class="stepper">
              <li
                v-for="(opt, i) in STATUS_OPTIONS"
                :key="opt.value"
                :class="{ done: i < stepIndex, current: i === stepIndex }"
              >
                <button
                  type="button"
                  :disabled="!permissions.status || updating"
                  :title="permissions.status ? `Mark as ${opt.label}` : 'Only the assignee or task owner can change status'"
                  @click="setStatus(opt.value)"
                >
                  <span class="step-dot">{{ i < stepIndex ? '✓' : i + 1 }}</span>
                  {{ opt.label }}
                </button>
              </li>
            </ol>
            <p v-if="!permissions.status" class="muted small">You can view this task but cannot change its status.</p>
          </div>

          <TaskActivity ref="activity" :task-id="task._id" />
        </div>

        <aside class="card meta-list">
          <div>
            <span class="label">Assigned to</span>
            <span class="person">
              <span class="avatar sm">{{ initials(task.assignedTo?.name) }}</span>
              {{ task.assignedTo?.name ?? '—' }}
            </span>
            <small class="muted">{{ task.assignedTo?.email }}</small>
          </div>
          <div>
            <span class="label">Created by</span>
            <span class="person">
              <span class="avatar sm">{{ initials(task.createdBy?.name) }}</span>
              {{ task.createdBy?.name ?? '—' }}
            </span>
            <small class="muted">{{ task.createdBy?.role }}</small>
          </div>
          <div>
            <span class="label">Due date</span>
            <strong :class="{ 'text-danger': overdue }">{{ formatDate(task.dueDate) }}</strong>
            <small class="muted">{{ dueLabel(task.dueDate) }}</small>
          </div>
          <div>
            <span class="label">Created</span>
            <span>{{ formatDateTime(task.createdAt) }}</span>
          </div>
          <div>
            <span class="label">Last updated</span>
            <span>{{ formatDateTime(task.updatedAt) }}</span>
          </div>
        </aside>
      </div>
    </template>
  </section>
</template>
