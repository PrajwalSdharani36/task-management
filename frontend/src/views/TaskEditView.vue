<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useTaskStore } from '@/stores/tasks';
import { useUiStore } from '@/stores/ui';
import TaskForm from '@/components/TaskForm.vue';
import { canEditTask } from '@/utils/permissions';

const props = defineProps({
  id: { type: String, required: true },
});

const auth = useAuthStore();
const taskStore = useTaskStore();
const ui = useUiStore();
const router = useRouter();

const submitting = ref(false);
const serverErrors = ref({});

async function handleSubmit(payload) {
  submitting.value = true;
  serverErrors.value = {};
  try {
    const { message } = await taskStore.updateTask(props.id, payload);
    ui.success(message);
    router.push(`/tasks/${props.id}`);
  } catch (err) {
    serverErrors.value = err.errors || {};
    ui.error(err.message);
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await Promise.all([taskStore.fetchTask(props.id), taskStore.fetchAssignees().catch(() => {})]);
  if (taskStore.currentTask && !canEditTask(auth.user, taskStore.currentTask)) {
    ui.error('Only the task creator or an admin can edit this task');
    router.replace(`/tasks/${props.id}`);
  }
});
</script>

<template>
  <section class="stack narrow">
    <RouterLink :to="`/tasks/${id}`" class="link-sm">← Back to task</RouterLink>
    <h2>Edit task</h2>

    <div v-if="taskStore.loading" class="card skeleton tall" />
    <div v-else-if="taskStore.error" class="alert alert-error">{{ taskStore.error }}</div>
    <TaskForm
      v-else-if="taskStore.currentTask"
      :initial="taskStore.currentTask"
      :assignees="taskStore.assignees"
      :submitting="submitting"
      :server-errors="serverErrors"
      submit-label="Save changes"
      @submit="handleSubmit"
      @cancel="router.back()"
    />
  </section>
</template>
