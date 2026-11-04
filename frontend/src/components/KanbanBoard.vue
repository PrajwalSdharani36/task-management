<script setup>
import { computed, ref } from 'vue';
import TaskCard from './TaskCard.vue';
import { STATUS_OPTIONS } from '@/utils/constants';

const props = defineProps({
  tasks: { type: Array, required: true },
  canMove: { type: Function, required: true },
});

const emit = defineEmits(['move']);

const draggingId = ref(null);
const overColumn = ref(null);

const columns = computed(() =>
  STATUS_OPTIONS.map((col) => ({
    ...col,
    tasks: props.tasks.filter((t) => t.status === col.value),
  }))
);

const draggingTask = computed(() => props.tasks.find((t) => t._id === draggingId.value));

function onDragStart(event, task) {
  draggingId.value = task._id;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', task._id);
}

function onDragEnd() {
  draggingId.value = null;
  overColumn.value = null;
}

function onDragOver(column) {
  if (draggingTask.value) overColumn.value = column.value;
}

function onDrop(column) {
  const task = draggingTask.value;
  onDragEnd();
  if (task && task.status !== column.value) emit('move', task, column.value);
}
</script>

<template>
  <div class="board">
    <section
      v-for="col in columns"
      :key="col.value"
      class="board-column"
      :class="{ over: overColumn === col.value && draggingTask?.status !== col.value }"
      :aria-label="`${col.label} column`"
      @dragover.prevent="onDragOver(col)"
      @dragleave.self="overColumn = null"
      @drop.prevent="onDrop(col)"
    >
      <header class="board-head">
        <span class="swatch" :data-status="col.value" />
        <h3>{{ col.label }}</h3>
        <span class="board-count">{{ col.tasks.length }}</span>
      </header>

      <div class="board-list">
        <div
          v-for="task in col.tasks"
          :key="task._id"
          class="board-item"
          :class="{ dragging: draggingId === task._id, locked: !canMove(task) }"
          :draggable="canMove(task)"
          :title="canMove(task) ? 'Drag to another column to change status' : 'You cannot change the status of this task'"
          @dragstart="onDragStart($event, task)"
          @dragend="onDragEnd"
        >
          <TaskCard :task="task" compact :can-change-status="canMove(task)" @status-change="(t, s) => emit('move', t, s)" />
        </div>
        <p v-if="!col.tasks.length" class="board-empty">Drop a task here</p>
      </div>
    </section>
  </div>
</template>
