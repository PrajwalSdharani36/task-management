<script setup>
import { reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { useFormat } from '@/composables/useFormat';
import PasswordInput from '@/components/PasswordInput.vue';

const auth = useAuthStore();
const ui = useUiStore();
const { initials, formatDate } = useFormat();

const name = ref(auth.user?.name ?? '');
const savingName = ref(false);

const pw = reactive({ currentPassword: '', newPassword: '', confirm: '' });
const savingPw = ref(false);

async function saveName() {
  if (name.value.trim().length < 2) return ui.error('Name must be at least 2 characters');
  savingName.value = true;
  try {
    ui.success(await auth.updateProfile({ name: name.value.trim() }));
  } catch (err) {
    ui.error(err.message);
  } finally {
    savingName.value = false;
  }
}

async function savePassword() {
  if (pw.newPassword.length < 6) return ui.error('New password must be at least 6 characters');
  if (pw.newPassword !== pw.confirm) return ui.error('New passwords do not match');
  savingPw.value = true;
  try {
    ui.success(await auth.updateProfile({ currentPassword: pw.currentPassword, newPassword: pw.newPassword }));
    Object.assign(pw, { currentPassword: '', newPassword: '', confirm: '' });
  } catch (err) {
    ui.error(err.message);
  } finally {
    savingPw.value = false;
  }
}
</script>

<template>
  <section class="stack narrow">
    <div class="card profile-head">
      <span class="avatar lg">{{ initials(auth.user?.name) }}</span>
      <div>
        <h2>{{ auth.user?.name }}</h2>
        <p class="muted">{{ auth.user?.email }}</p>
        <div class="row">
          <span class="role-pill" :data-role="auth.role">{{ auth.role }}</span>
          <small class="muted">Member since {{ formatDate(auth.user?.createdAt) }}</small>
        </div>
      </div>
    </div>

    <form class="card form" @submit.prevent="saveName">
      <h3 class="card-title">Display name</h3>
      <div class="row">
        <input v-model="name" class="input grow" aria-label="Display name" />
        <button class="btn btn-primary" :disabled="savingName">{{ savingName ? 'Saving…' : 'Save' }}</button>
      </div>
    </form>

    <form class="card form" @submit.prevent="savePassword">
      <h3 class="card-title">Change password</h3>
      <div class="field">
        <label for="cur">Current password</label>
        <PasswordInput id="cur" v-model="pw.currentPassword" autocomplete="current-password" />
      </div>
      <div class="grid-2">
        <div class="field">
          <label for="new">New password</label>
          <PasswordInput id="new" v-model="pw.newPassword" autocomplete="new-password" />
        </div>
        <div class="field">
          <label for="confirm">Confirm new password</label>
          <PasswordInput id="confirm" v-model="pw.confirm" autocomplete="new-password" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" :disabled="savingPw">{{ savingPw ? 'Updating…' : 'Update password' }}</button>
      </div>
    </form>
  </section>
</template>
