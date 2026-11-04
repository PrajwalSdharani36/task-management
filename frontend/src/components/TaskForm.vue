<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@/utils/constants';
import { useFormat } from '@/composables/useFormat';

const props = defineProps({
  initial: { type: Object, default: null },
  assignees: { type: Array, default: () => [] },
  submitting: { type: Boolean, default: false },
  submitLabel: { type: String, default: 'Save task' },
  serverErrors: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['submit', 'cancel']);

const { toInputDate } = useFormat();
const today = new Date().toISOString().slice(0, 10);
const isEdit = computed(() => Boolean(props.initial));

const form = reactive({
  title: '',
  description: '',
  assignedTo: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
});

const touched = ref(false);

watch(
  () => props.initial,
  (task) => {
    if (!task) return;
    Object.assign(form, {
      title: task.title,
      description: task.description ?? '',
      assignedTo: task.assignedTo?._id ?? task.assignedTo ?? '',
      priority: task.priority,
      status: task.status,
      dueDate: toInputDate(task.dueDate),
    });
  },
  { immediate: true }
);

const errors = computed(() => {
  const e = {};
  if (form.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
  if (!form.assignedTo) e.assignedTo = 'Choose who should work on this task';
  if (!form.dueDate) e.dueDate = 'Pick a due date';
  return e;
});

const isValid = computed(() => Object.keys(errors.value).length === 0);
const errorFor = (field) => (touched.value && errors.value[field]) || props.serverErrors[field] || '';

function submit() {
  touched.value = true;
  if (!isValid.value) return;

  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    assignedTo: form.assignedTo,
    priority: form.priority,
    dueDate: form.dueDate,
  };
  if (isEdit.value) payload.status = form.status;

  emit('submit', payload);
}
</script>

<template>
  <form class="card form" novalidate @submit.prevent="submit">
    <div class="field">
      <label for="title">Title</label>
      <input id="title" v-model="form.title" class="input" maxlength="120" placeholder="e.g. Develop Login Page" />
      <small v-if="errorFor('title')" class="field-error">{{ errorFor('title') }}</small>
    </div>

    <div class="field">
      <label for="description">Description</label>
      <textarea
        id="description"
        v-model="form.description"
        class="input"
        rows="4"
        maxlength="2000"
        placeholder="What needs to be done, and how will we know it's finished?"
      />
      <small class="muted right">{{ form.description.length }}/2000</small>
    </div>

    <div class="grid-2">
      <div class="field">
        <label for="assignedTo">Assign to</label>
        <select id="assignedTo" v-model="form.assignedTo" class="input">
          <option value="" disabled>Select a team member</option>
          <option v-for="user in assignees" :key="user._id" :value="user._id">
            {{ user.name }} ({{ user.role }})
          </option>
        </select>
        <small v-if="errorFor('assignedTo')" class="field-error">{{ errorFor('assignedTo') }}</small>
      </div>

      <div class="field">
        <label for="dueDate">Due date</label>
        <input id="dueDate" v-model="form.dueDate" type="date" class="input" :min="isEdit ? undefined : today" />
        <small v-if="errorFor('dueDate')" class="field-error">{{ errorFor('dueDate') }}</small>
      </div>
    </div>

    <div class="grid-2">
      <div class="field">
        <span class="label">Priority</span>
        <div class="segmented">
          <label v-for="opt in PRIORITY_OPTIONS" :key="opt.value" :data-priority="opt.value" :class="{ selected: form.priority === opt.value }">
            <input v-model="form.priority" type="radio" name="priority" :value="opt.value" />
            {{ opt.label }}
          </label>
        </div>
      </div>

      <div v-if="isEdit" class="field">
        <label for="status">Status</label>
        <select id="status" v-model="form.status" class="input">
          <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-ghost" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? 'Saving…' : submitLabel }}
      </button>
    </div>
  </form>
</template>
