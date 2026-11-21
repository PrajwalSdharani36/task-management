<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import PasswordInput from '@/components/PasswordInput.vue';
import ThemeToggle from '@/components/ThemeToggle.vue';

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: '', password: '' });
const loading = ref(false);
const error = ref('');

const showDemo = import.meta.env.VITE_DEMO_LOGINS === 'true';

const demoAccounts = [
  { role: 'Admin', email: 'asha@team6.dev' },
  { role: 'Manager', email: 'manoj@team6.dev' },
  { role: 'Employee', email: 'prajwal@team6.dev' },
];

function useDemo(email) {
  form.email = email;
  form.password = 'Password@123';
}

async function submit() {
  error.value = '';
  if (!form.email || !form.password) {
    error.value = 'Enter your email and password';
    return;
  }
  loading.value = true;
  try {
    const user = await auth.login(form);
    ui.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/dashboard';
    router.replace(redirect);
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
      <h2>Plan the work.<br />Track the progress.<br />Ship it together.</h2>
      <p>A role-based task portal where managers assign work, employees update progress, and admins keep the team organised.</p>
    </section>

    <section class="auth-panel">
      <ThemeToggle class="auth-theme" />
      <form class="auth-form" novalidate @submit.prevent="submit">
        <h1>Sign in</h1>
        <p class="muted">Use your work email to continue.</p>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="field">
          <label for="email">Email</label>
          <input id="email" v-model.trim="form.email" type="email" class="input" autocomplete="email" placeholder="you@team6.dev" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <PasswordInput id="password" v-model="form.password" autocomplete="current-password" placeholder="••••••••" />
        </div>

        <button class="btn btn-primary btn-block" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button>

        <p class="muted center">New here? <RouterLink to="/register">Create an account</RouterLink></p>

        <div v-if="showDemo" class="demo-box">
          <span class="label">Quick login (development only)</span>
          <div class="demo-buttons">
            <button v-for="d in demoAccounts" :key="d.email" type="button" class="btn btn-ghost btn-sm" @click="useDemo(d.email)">
              {{ d.role }}
            </button>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>
