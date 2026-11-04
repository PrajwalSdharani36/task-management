import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';

const defaultFilters = () => ({
  search: '',
  status: '',
  priority: '',
  assignedTo: '',
  sort: 'newest',
  page: 1,
  limit: 12,
});

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([]);
  const pagination = ref({ page: 1, pages: 1, total: 0, limit: 12 });
  const filters = reactive(defaultFilters());
  const stats = ref(null);
  const upcoming = ref([]);
  const byPriority = ref({ low: 0, medium: 0, high: 0 });
  const workload = ref([]);
  const currentTask = ref(null);
  const assignees = ref([]);
  const loading = ref(false);
  const error = ref('');

  function resetFilters() {
    Object.assign(filters, defaultFilters());
  }

  async function fetchTasks({ mine = false } = {}) {
    loading.value = true;
    error.value = '';
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
      if (mine) params.mine = true;
      const { data } = await taskService.list(params);
      tasks.value = data.tasks;
      pagination.value = data.pagination;
    } catch (err) {
      error.value = err.message;
      tasks.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    loading.value = true;
    error.value = '';
    try {
      const { data } = await taskService.stats();
      stats.value = data.stats;
      upcoming.value = data.upcoming;
      byPriority.value = data.byPriority ?? { low: 0, medium: 0, high: 0 };
      workload.value = data.workload ?? [];
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchTask(id) {
    loading.value = true;
    error.value = '';
    currentTask.value = null;
    try {
      const { data } = await taskService.get(id);
      currentTask.value = data.task;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAssignees() {
    const { data } = await userService.list();
    assignees.value = data.users.filter((u) => u.role !== 'admin');
    return assignees.value;
  }

  async function createTask(payload) {
    const { data, message } = await taskService.create(payload);
    return { task: data.task, message };
  }

  async function updateTask(id, payload) {
    const { data, message } = await taskService.update(id, payload);
    replaceLocal(data.task);
    return { task: data.task, message };
  }

  async function updateStatus(task, status) {
    const previous = task.status;
    task.status = status;
    try {
      return await updateTask(task._id, { status });
    } catch (err) {
      task.status = previous;
      throw err;
    }
  }

  async function deleteTask(id) {
    const { message } = await taskService.remove(id);
    tasks.value = tasks.value.filter((t) => t._id !== id);
    if (currentTask.value?._id === id) currentTask.value = null;
    return message;
  }

  function replaceLocal(updated) {
    const index = tasks.value.findIndex((t) => t._id === updated._id);
    if (index !== -1) tasks.value[index] = updated;
    if (currentTask.value?._id === updated._id) currentTask.value = updated;
  }

  return {
    tasks,
    pagination,
    filters,
    stats,
    upcoming,
    byPriority,
    workload,
    currentTask,
    assignees,
    loading,
    error,
    resetFilters,
    fetchTasks,
    fetchStats,
    fetchTask,
    fetchAssignees,
    createTask,
    updateTask,
    updateStatus,
    deleteTask,
  };
});
