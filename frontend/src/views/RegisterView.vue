<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { authService } from '@/services/authService';
import PasswordInput from '@/components/PasswordInput.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();

const form = reactive({ name: '', email: '', password: '', confirm: '' });
const loading = ref(false);
const error = ref('');

const config = ref({ allowRegistration: true, emailDomain: null });

const mismatch = computed(() => form.confirm && form.password !== form.confirm);
const wrongDomain = computed(() => {
  const domain = config.value.emailDomain;
  return Boolean(domain && form.email.includes('@') && !form.email.toLowerCase().endsWith(`@${domain}`));
});

onMounted(async () => {
  try {
    const { data } = await authService.config();
    config.value = data;
  } catch {
    config.value = { allowRegistration: true, emailDomain: null };
  }
});

async function submit() {
  error.value = '';
  if (!form.name || !form.email || !form.password) {
    error.value = 'All fields are required';
    return;
  }
  if (wrongDomain.value) {
    error.value = `Please use your @${config.value.emailDomain} email address`;
    return;
  }
  if (form.password.length < 6) {
    error.value = 'Password must be at least 6 characters';
    return;
  }
  if (mismatch.value) {
    error.value = 'Passwords do not match';
    return;
  }
  loading.value = true;
  try {
    await auth.register({ name: form.name, email: form.email, password: form.password });
    ui.success('Account created. You are signed in as an employee.');
    router.replace('/dashboard');
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <section class="auth-aside">
      <div class="brand light">
        <span class="brand-mark">
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </span>
        <span>TaskFlow</span>
      </div>
      <h2>Join your team's workspace.</h2>
      <p>New accounts start with the Employee role. An admin can promote you to Manager from the Users page.</p>
    </section>

    <section class="auth-panel">
      <ThemeToggle class="auth-theme" />
      <form class="auth-form" novalidate @submit.prevent="submit">
        <h1>Create account</h1>
        <p class="muted">It takes less than a minute.</p>

        <div v-if="!config.allowRegistration" class="alert alert-error">
          Self-registration is turned off. Ask an admin to create your account.
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="field">
          <label for="name">Full name</label>
          <input id="name" v-model.trim="form.name" class="input" autocomplete="name" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            class="input"
            autocomplete="email"
            :placeholder="config.emailDomain ? `yourname@${config.emailDomain}` : 'you@company.com'"
          />
          <small v-if="wrongDomain" class="field-error">Only @{{ config.emailDomain }} addresses can register</small>
          <small v-else-if="config.emailDomain" class="muted">Use your @{{ config.emailDomain }} email</small>
        </div>
        <div class="grid-2">
          <div class="field">
            <label for="password">Password</label>
            <PasswordInput id="password" v-model="form.password" autocomplete="new-password" />
          </div>
          <div class="field">
            <label for="confirm">Confirm</label>
            <PasswordInput id="confirm" v-model="form.confirm" autocomplete="new-password" />
            <small v-if="mismatch" class="field-error">Passwords do not match</small>
          </div>
        </div>

        <button class="btn btn-primary btn-block" :disabled="loading || !config.allowRegistration">
          {{ loading ? 'Creating…' : 'Create account' }}
        </button>
        <p class="muted center">Already registered? <RouterLink to="/login">Sign in</RouterLink></p>
      </form>
    </section>
  </div>
</template>
