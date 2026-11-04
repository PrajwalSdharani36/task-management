import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authService } from '@/services/authService';
import { TOKEN_KEY } from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY));
  const user = ref(null);
  const initialized = ref(false);
  let initPromise = null;

  const isAuthenticated = computed(() => Boolean(token.value && user.value));
  const role = computed(() => user.value?.role ?? null);
  const isAdmin = computed(() => role.value === 'admin');
  const isManager = computed(() => role.value === 'manager');
  const canManageTasks = computed(() => isAdmin.value || isManager.value);

  function setSession(newToken, newUser) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem(TOKEN_KEY, newToken);
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  async function fetchMe() {
    const { data } = await authService.me();
    user.value = data.user;
    return data.user;
  }

  function init() {
    if (initialized.value) return Promise.resolve();
    if (!initPromise) {
      initPromise = (async () => {
        if (token.value) {
          try {
            await fetchMe();
          } catch {
            clearSession();
          }
        }
        initialized.value = true;
      })();
    }
    return initPromise;
  }

  async function login(credentials) {
    const { data } = await authService.login(credentials);
    setSession(data.token, data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await authService.register(payload);
    setSession(data.token, data.user);
    return data.user;
  }

  async function updateProfile(payload) {
    const { data, message } = await authService.updateMe(payload);
    user.value = data.user;
    return message;
  }

  function logout() {
    clearSession();
  }

  return {
    token,
    user,
    initialized,
    isAuthenticated,
    role,
    isAdmin,
    isManager,
    canManageTasks,
    init,
    login,
    register,
    fetchMe,
    updateProfile,
    logout,
  };
});
