<script setup>
import StatusBadge from './StatusBadge.vue';
import PriorityBadge from './PriorityBadge.vue';
import { useFormat } from '@/composables/useFormat';
import { STATUS_OPTIONS } from '@/utils/constants';

defineProps({
  tasks: { type: Array, required: true },
  canChangeStatus: { type: Function, required: true },
  canDelete: { type: Function, required: true },
});

const emit = defineEmits(['status-change', 'delete']);

const { formatDate } = useFormat();
const isOverdue = (task) => task.status !== 'completed' && new Date(task.dueDate) < new Date();
</script>

<template>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Assigned to</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Due date</th>
          <th class="right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in tasks" :key="task._id">
          <td>
            <RouterLink :to="`/tasks/${task._id}`" class="table-link">{{ task.title }}</RouterLink>
            <small class="muted block">by {{ task.createdBy?.name ?? '—' }}</small>
          </td>
          <td>{{ task.assignedTo?.name ?? '—' }}</td>
          <td><PriorityBadge :priority="task.priority" /></td>
          <td>
            <select
              v-if="canChangeStatus(task)"
              class="input input-sm"
              :value="task.status"
              aria-label="Change status"
              @change="emit('status-change', task, $event.target.value)"
            >
              <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <StatusBadge v-else :status="task.status" />
          </td>
          <td :class="{ 'text-danger': isOverdue(task) }">{{ formatDate(task.dueDate) }}</td>
          <td class="right">
            <RouterLink :to="`/tasks/${task._id}`" class="btn btn-ghost btn-sm">View</RouterLink>
            <button v-if="canDelete(task)" class="btn btn-ghost btn-sm text-danger" @click="emit('delete', task)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
