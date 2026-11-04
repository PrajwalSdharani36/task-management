import Task from '../models/Task.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../config/roles.js';

export function taskScopeFor(user) {
  if (user.role === ROLES.ADMIN) return {};
  if (user.role === ROLES.MANAGER) {
    return { $or: [{ createdBy: user._id }, { assignedTo: user._id }] };
  }
  return { assignedTo: user._id };
}

const refId = (ref) => (ref?._id ?? ref)?.toString();

export function isTaskOwner(user, task) {
  return user.role === ROLES.ADMIN || refId(task.createdBy) === user._id.toString();
}

export function isTaskAssignee(user, task) {
  return refId(task.assignedTo) === user._id.toString();
}

export async function loadAccessibleTask(req, _res, next) {
  const task = await Task.findOne({ _id: req.params.id, ...taskScopeFor(req.user) })
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email role');

  if (!task) throw ApiError.notFound('Task not found');

  req.task = task;
  next();
}

export function requireTaskOwner(req, _res, next) {
  if (!isTaskOwner(req.user, req.task)) {
    return next(ApiError.forbidden('Only the task creator or an admin can do this'));
  }
  next();
}
