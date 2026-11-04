import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { taskScopeFor, isTaskOwner, isTaskAssignee } from '../middleware/taskAccess.js';
import { ROLES, TASK_PRIORITY, TASK_STATUS } from '../config/roles.js';

const EDITABLE_FIELDS = ['title', 'description', 'assignedTo', 'priority', 'status', 'dueDate'];
const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  dueSoon: { dueDate: 1 },
  updated: { updatedAt: -1 },
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function ensureAssignableUser(userId) {
  if (!mongoose.isValidObjectId(userId)) throw ApiError.badRequest('Assigned user is not valid');
  const assignee = await User.findById(userId);
  if (!assignee) throw ApiError.badRequest('Assigned user does not exist');
  if (assignee.role === ROLES.ADMIN) throw ApiError.badRequest('Tasks cannot be assigned to an admin');
  return assignee;
}

export async function getTasks(req, res) {
  const { status, priority, search, assignedTo, mine, sort = 'newest' } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const filter = { ...taskScopeFor(req.user) };
  if (status && TASK_STATUS.includes(status)) filter.status = status;
  if (priority && TASK_PRIORITY.includes(priority)) filter.priority = priority;
  if (search) filter.title = { $regex: escapeRegex(String(search)), $options: 'i' };
  if (mine === 'true') filter.assignedTo = req.user._id;
  else if (assignedTo && mongoose.isValidObjectId(assignedTo) && req.user.role !== ROLES.EMPLOYEE) {
    filter.assignedTo = assignedTo;
  }

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort(SORT_OPTIONS[sort] || SORT_OPTIONS.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email role'),
    Task.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: {
      tasks,
      pagination: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
    },
  });
}

export async function getTaskStats(req, res) {
  const scope = taskScopeFor(req.user);
  const now = new Date();

  const [result] = await Task.aggregate([
    { $match: scope },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        highPriority: {
          $sum: { $cond: [{ $and: [{ $eq: ['$priority', 'high'] }, { $ne: ['$status', 'completed'] }] }, 1, 0] },
        },
        overdue: {
          $sum: { $cond: [{ $and: [{ $lt: ['$dueDate', now] }, { $ne: ['$status', 'completed'] }] }, 1, 0] },
        },
      },
    },
    { $project: { _id: 0 } },
  ]);

  const stats = result || { total: 0, todo: 0, inProgress: 0, completed: 0, highPriority: 0, overdue: 0 };
  stats.completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const countStatus = (status) => ({ $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] } });

  const [upcoming, priorityRows, workload] = await Promise.all([
    Task.find({ ...scope, status: { $ne: 'completed' } })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('assignedTo', 'name email role'),
    Task.aggregate([
      { $match: { ...scope, status: { $ne: 'completed' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
    req.user.role === ROLES.EMPLOYEE
      ? []
      : Task.aggregate([
          { $match: scope },
          {
            $group: {
              _id: '$assignedTo',
              todo: countStatus('todo'),
              inProgress: countStatus('in_progress'),
              completed: countStatus('completed'),
              total: { $sum: 1 },
            },
          },
          { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
          { $unwind: '$user' },
          {
            $project: {
              _id: 0,
              userId: '$_id',
              name: '$user.name',
              role: '$user.role',
              todo: 1,
              inProgress: 1,
              completed: 1,
              total: 1,
            },
          },
          { $sort: { total: -1, name: 1 } },
          { $limit: 8 },
        ]),
  ]);

  const byPriority = Object.fromEntries(TASK_PRIORITY.map((p) => [p, 0]));
  priorityRows.forEach((row) => {
    byPriority[row._id] = row.count;
  });

  sendSuccess(res, { data: { stats, byPriority, workload, upcoming } });
}

export async function getTask(req, res) {
  sendSuccess(res, { data: { task: req.task } });
}

export async function createTask(req, res) {
  const { title, description, assignedTo, priority, dueDate } = req.body;
  await ensureAssignableUser(assignedTo);

  const task = new Task({
    title,
    description,
    assignedTo,
    priority,
    dueDate,
    createdBy: req.user._id,
  });
  task.$locals.actor = req.user._id;
  await task.save();

  await task.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'createdBy', select: 'name email role' },
  ]);

  sendSuccess(res, { statusCode: 201, message: 'Task created successfully', data: { task } });
}

export async function updateTask(req, res) {
  const { task, user } = req;
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => EDITABLE_FIELDS.includes(key))
  );

  if (!Object.keys(updates).length) throw ApiError.badRequest('No valid fields to update');

  const owner = isTaskOwner(user, task);
  const assignee = isTaskAssignee(user, task);

  if (!owner) {
    const onlyStatus = Object.keys(updates).every((key) => key === 'status');
    if (!assignee || !onlyStatus) {
      throw ApiError.forbidden('You can only update the status of tasks assigned to you');
    }
  }

  if (updates.assignedTo) await ensureAssignableUser(updates.assignedTo);

  Object.assign(task, updates);
  task.$locals.actor = user._id;
  await task.save();
  await task.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'createdBy', select: 'name email role' },
  ]);

  sendSuccess(res, { message: 'Task updated successfully', data: { task } });
}

export async function deleteTask(req, res) {
  await Activity.deleteMany({ task: req.task._id });
  await req.task.deleteOne();
  sendSuccess(res, { message: 'Task deleted successfully', data: { id: req.task._id } });
}
