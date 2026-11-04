import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { setUnauthorizedHandler } from '@/services/api';

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true, layout: 'blank', title: 'Sign in' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guestOnly: true, layout: 'blank', title: 'Create account' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true, title: 'Dashboard' },
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/views/TasksView.vue'),
    props: { mine: false },
    meta: { requiresAuth: true, title: 'Tasks' },
  },
  {
    path: '/tasks/mine',
    name: 'my-tasks',
    component: () => import('@/views/TasksView.vue'),
    props: { mine: true },
    meta: { requiresAuth: true, title: 'My Tasks' },
  },
  {
    path: '/tasks/create',
    name: 'task-create',
    component: () => import('@/views/TaskCreateView.vue'),
    meta: { requiresAuth: true, roles: ['admin', 'manager'], title: 'Create Task' },
  },
  {
    path: '/tasks/:id',
    name: 'task-detail',
    component: () => import('@/views/TaskDetailView.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Task Details' },
  },
  {
    path: '/tasks/:id/edit',
    name: 'task-edit',
    component: () => import('@/views/TaskEditView.vue'),
    props: true,
    meta: { requiresAuth: true, roles: ['admin', 'manager'], title: 'Edit Task' },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/views/AdminUsersView.vue'),
    meta: { requiresAuth: true, roles: ['admin'], title: 'Manage Users' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true, title: 'Profile' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { layout: 'blank', title: 'Page not found' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.init();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' };
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    useUiStore().error('You do not have permission to open that page');
    return { name: 'dashboard' };
  }

  return true;
});

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · TaskFlow` : 'TaskFlow';
  useUiStore().sidebarOpen = false;
});

setUnauthorizedHandler((message) => {
  const auth = useAuthStore();
  if (!auth.token) return;
  auth.logout();
  useUiStore().error(message);
  const current = router.currentRoute.value;
  router.replace({ name: 'login', query: current.meta.requiresAuth ? { redirect: current.fullPath } : {} });
});

export default router;
