<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { userService } from '@/services/userService';
import { useFormat } from '@/composables/useFormat';
import { ROLE_OPTIONS } from '@/utils/constants';
import PasswordInput from '@/components/PasswordInput.vue';

const auth = useAuthStore();
const ui = useUiStore();
const { initials, formatDate } = useFormat();

const users = ref([]);
const loading = ref(false);
const error = ref('');
const roleFilter = ref('');
const showCreate = ref(false);
const creating = ref(false);
const newUser = reactive({ name: '', email: '', password: '', role: 'employee' });

const filtered = computed(() => (roleFilter.value ? users.value.filter((u) => u.role === roleFilter.value) : users.value));

const counts = computed(() =>
  ROLE_OPTIONS.reduce((acc, r) => ({ ...acc, [r.value]: users.value.filter((u) => u.role === r.value).length }), {})
);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await userService.list();
    users.value = data.users;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function changeRole(user, role) {
  const previous = user.role;
  user.role = role;
  try {
    const { data } = await userService.update(user._id, { role });
    ui.success(`${user.name} is now ${role === 'admin' ? 'an' : 'a'} ${role}`);
    if (data.transferredTasks) ui.info(`${data.transferredTasks} task(s) they created now belong to you`);
  } catch (err) {
    user.role = previous;
    ui.error(err.message);
  }
}

async function remove(user) {
  if (!window.confirm(`Delete ${user.name}? Their completed tasks will be removed too.`)) return;
  try {
    const { message } = await userService.remove(user._id);
    users.value = users.value.filter((u) => u._id !== user._id);
    ui.success(message);
  } catch (err) {
    ui.error(err.message);
  }
}

async function create() {
  if (!newUser.name || !newUser.email || newUser.password.length < 6) {
    ui.error('Name, email and a password of at least 6 characters are required');
    return;
  }
  creating.value = true;
  try {
    const { message } = await userService.create({ ...newUser });
    ui.success(message);
    Object.assign(newUser, { name: '', email: '', password: '', role: 'employee' });
    showCreate.value = false;
    load();
  } catch (err) {
    ui.error(err.message);
  } finally {
    creating.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="stack">
    <div class="page-head">
      <div>
        <h2>Team members</h2>
        <p class="muted">
          {{ users.length }} users · {{ counts.admin }} admin · {{ counts.manager }} managers · {{ counts.employee }} employees
        </p>
      </div>
      <div class="row">
        <select v-model="roleFilter" class="input" aria-label="Filter by role">
          <option value="">All roles</option>
          <option v-for="r in ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
        <button class="btn btn-primary" @click="showCreate = !showCreate">{{ showCreate ? 'Close' : '+ Add user' }}</button>
      </div>
    </div>

    <Transition name="fade">
      <form v-if="showCreate" class="card form inline-form" @submit.prevent="create">
        <input v-model.trim="newUser.name" class="input" placeholder="Full name" aria-label="Full name" />
        <input v-model.trim="newUser.email" class="input" type="email" placeholder="name@team6.dev" aria-label="Email" />
        <PasswordInput id="new-user-password" v-model="newUser.password" autocomplete="new-password" placeholder="Temporary password" />
        <select v-model="newUser.role" class="input" aria-label="Role">
          <option v-for="r in ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
        <button class="btn btn-primary" :disabled="creating">{{ creating ? 'Adding…' : 'Add user' }}</button>
      </form>
    </Transition>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-else-if="loading && !users.length" class="card skeleton tall" />

    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Open tasks</th>
            <th>Joined</th>
            <th class="right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filtered" :key="user._id">
            <td>
              <span class="person">
                <span class="avatar sm">{{ initials(user.name) }}</span>
                <span>
                  <strong>{{ user.name }}</strong>
                  <small class="muted block">{{ user.email }}</small>
                </span>
              </span>
            </td>
            <td>
              <span v-if="user._id === auth.user._id" class="role-pill" :data-role="user.role">{{ user.role }} (you)</span>
              <select v-else class="input input-sm" :value="user.role" aria-label="Change role" @change="changeRole(user, $event.target.value)">
                <option v-for="r in ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
              </select>
            </td>
            <td>{{ user.openTasks }}</td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td class="right">
              <button v-if="user._id !== auth.user._id" class="btn btn-ghost btn-sm text-danger" @click="remove(user)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
