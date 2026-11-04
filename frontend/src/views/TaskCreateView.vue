<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTaskStore } from '@/stores/tasks';
import { useUiStore } from '@/stores/ui';
import TaskForm from '@/components/TaskForm.vue';

const taskStore = useTaskStore();
const ui = useUiStore();
const router = useRouter();

const submitting = ref(false);
const serverErrors = ref({});
const loadError = ref('');

async function handleSubmit(payload) {
  submitting.value = true;
  serverErrors.value = {};
  try {
    const { task, message } = await taskStore.createTask(payload);
    ui.success(message);
    router.push(`/tasks/${task._id}`);
  } catch (err) {
    serverErrors.value = err.errors || {};
    ui.error(err.message);
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  try {
    await taskStore.fetchAssignees();
  } catch (err) {
    loadError.value = err.message;
  }
});
</script>

<template>
  <section class="stack narrow">
    <div class="page-head">
      <div>
        <h2>Create a task</h2>
        <p class="muted">Assign work to a team member with a priority and a deadline.</p>
      </div>
    </div>
    <div v-if="loadError" class="alert alert-error">Could not load team members: {{ loadError }}</div>
    <TaskForm
      :assignees="taskStore.assignees"
      :submitting="submitting"
      :server-errors="serverErrors"
      submit-label="Create task"
      @submit="handleSubmit"
      @cancel="router.back()"
    />
  </section>
</template>
