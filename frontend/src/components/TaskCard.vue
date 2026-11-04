<script setup>
import { computed } from 'vue';
import StatusBadge from './StatusBadge.vue';
import PriorityBadge from './PriorityBadge.vue';
import { useFormat } from '@/composables/useFormat';
import { STATUS_OPTIONS } from '@/utils/constants';

const props = defineProps({
  task: { type: Object, required: true },
  canChangeStatus: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(['status-change']);

const { formatDate, dueLabel, initials } = useFormat();

const overdue = computed(() => props.task.status !== 'completed' && new Date(props.task.dueDate) < new Date());
</script>

<template>
  <article class="task-card" :class="{ overdue, done: task.status === 'completed', compact, 'has-select': canChangeStatus }">
    <header class="task-card-head">
      <PriorityBadge :priority="task.priority" />
      <StatusBadge :status="task.status" />
    </header>

    <RouterLink :to="`/tasks/${task._id}`" class="task-card-title">{{ task.title }}</RouterLink>
    <p v-if="!compact && task.description" class="task-card-desc">{{ task.description }}</p>

    <footer class="task-card-foot">
      <span class="assignee" :title="task.assignedTo?.email">
        <span class="avatar sm">{{ initials(task.assignedTo?.name) }}</span>
        {{ task.assignedTo?.name ?? 'Unassigned' }}
      </span>
      <span class="due" :class="{ late: overdue }" :title="formatDate(task.dueDate)">
        {{ overdue ? 'Overdue · ' : '' }}{{ dueLabel(task.dueDate) }}
      </span>
    </footer>

    <select
      v-if="canChangeStatus"
      class="input input-sm status-select"
      :value="task.status"
      aria-label="Change status"
      @change="emit('status-change', task, $event.target.value)"
    >
      <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </article>
</template>
