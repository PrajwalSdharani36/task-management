const idOf = (ref) => (ref && typeof ref === 'object' ? ref._id : ref);

export function isTaskOwner(user, task) {
  if (!user || !task) return false;
  return user.role === 'admin' || idOf(task.createdBy) === user._id;
}

export function isTaskAssignee(user, task) {
  if (!user || !task) return false;
  return idOf(task.assignedTo) === user._id;
}

export function canEditTask(user, task) {
  return isTaskOwner(user, task);
}

export function canChangeStatus(user, task) {
  return isTaskOwner(user, task) || isTaskAssignee(user, task);
}

export function canDeleteTask(user, task) {
  return isTaskOwner(user, task);
}
