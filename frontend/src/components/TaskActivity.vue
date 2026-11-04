<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { activityService } from '@/services/activityService';
import { useFormat } from '@/composables/useFormat';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, labelFor } from '@/utils/constants';

const props = defineProps({
  taskId: { type: String, required: true },
});

const auth = useAuthStore();
const ui = useUiStore();
const { initials, timeAgo, formatDate, formatDateTime } = useFormat();

const entries = ref([]);
const loading = ref(false);
const error = ref('');
const draft = ref('');
const posting = ref(false);

const MAX = 1000;
const remaining = computed(() => MAX - draft.value.length);
const commentCount = computed(() => entries.value.filter((e) => e.type === 'comment').length);

function describe(entry) {
  switch (entry.type) {
    case 'created':
      return 'created this task';
    case 'status':
      return `moved it from ${labelFor(STATUS_OPTIONS, entry.from)} to ${labelFor(STATUS_OPTIONS, entry.to)}`;
    case 'assigned':
      return `reassigned it from ${entry.fromUser?.name ?? 'someone'} to ${entry.toUser?.name ?? 'someone'}`;
    case 'priority':
      return `changed priority from ${labelFor(PRIORITY_OPTIONS, entry.from)} to ${labelFor(PRIORITY_OPTIONS, entry.to)}`;
    case 'due_date':
      return `moved the due date to ${formatDate(entry.to)}`;
    case 'edited':
      return 'updated the title or description';
    default:
      return 'commented';
  }
}

const canDelete = (entry) => entry.type === 'comment' && (auth.isAdmin || entry.actor?._id === auth.user?._id);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await activityService.list(props.taskId);
    entries.value = data.activity;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function post() {
  const text = draft.value.trim();
  if (!text || posting.value) return;
  posting.value = true;
  try {
    const { data } = await activityService.addComment(props.taskId, text);
    entries.value.push(data.comment);
    draft.value = '';
  } catch (err) {
    ui.error(err.message);
  } finally {
    posting.value = false;
  }
}

async function remove(entry) {
  if (!window.confirm('Delete this comment?')) return;
  try {
    await activityService.removeComment(props.taskId, entry._id);
    entries.value = entries.value.filter((e) => e._id !== entry._id);
    ui.success('Comment deleted');
  } catch (err) {
    ui.error(err.message);
  }
}

function onKeydown(event) {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) post();
}

defineExpose({ reload: load });

onMounted(load);
</script>

<template>
  <div class="card">
    <div class="card-title-row">
      <h3 class="card-title">Activity &amp; comments</h3>
      <span class="muted small">{{ commentCount }} comment{{ commentCount === 1 ? '' : 's' }}</span>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
      <button class="btn btn-ghost btn-sm" @click="load">Retry</button>
    </div>
    <p v-else-if="loading && !entries.length" class="muted">Loading history…</p>

    <ol v-else class="timeline">
      <li v-for="entry in entries" :key="entry._id" :class="['timeline-item', entry.type]">
        <span class="timeline-marker">
          <span v-if="entry.type === 'comment'" class="avatar sm">{{ initials(entry.actor?.name) }}</span>
          <span v-else class="timeline-dot" :data-type="entry.type" :data-to="entry.to" />
        </span>
        <div class="timeline-body">
          <p class="timeline-line">
            <strong>{{ entry.actor?.name ?? 'Deleted user' }}</strong>
            <span v-if="entry.type !== 'comment'" class="timeline-text">{{ describe(entry) }}</span>
            <time class="muted" :datetime="entry.createdAt" :title="formatDateTime(entry.createdAt)">· {{ timeAgo(entry.createdAt) }}</time>
            <button v-if="canDelete(entry)" class="link-btn" @click="remove(entry)">Delete</button>
          </p>
          <p v-if="entry.type === 'comment'" class="comment-bubble prewrap">{{ entry.text }}</p>
        </div>
      </li>
    </ol>

    <form class="comment-form" @submit.prevent="post">
      <textarea
        v-model="draft"
        class="input"
        rows="2"
        :maxlength="MAX"
        placeholder="Write a comment… (Ctrl + Enter to post)"
        aria-label="Write a comment"
        @keydown="onKeydown"
      />
      <div class="comment-actions">
        <small class="muted">{{ remaining }} characters left</small>
        <button class="btn btn-primary btn-sm" :disabled="!draft.trim() || posting">{{ posting ? 'Posting…' : 'Post comment' }}</button>
      </div>
    </form>
  </div>
</template>
