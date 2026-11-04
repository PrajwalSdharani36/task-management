export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
});

export const ROLE_VALUES = Object.values(ROLES);

export const TASK_STATUS = Object.freeze(['todo', 'in_progress', 'completed']);
export const TASK_PRIORITY = Object.freeze(['low', 'medium', 'high']);
