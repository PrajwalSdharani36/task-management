import User from '../models/User.js';
import Task from '../models/Task.js';
import Activity from '../models/Activity.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { assertAllowedEmail } from '../utils/email.js';
import { ROLES, ROLE_VALUES } from '../config/roles.js';

export async function getUsers(req, res) {
  const filter = {};
  if (req.user.role === ROLES.MANAGER) filter.role = { $ne: ROLES.ADMIN };
  if (req.query.role && ROLE_VALUES.includes(req.query.role)) {
    if (req.user.role === ROLES.MANAGER && req.query.role === ROLES.ADMIN) {
      return sendSuccess(res, { data: { users: [] } });
    }
    filter.role = req.query.role;
  }

  const users = await User.find(filter).sort({ role: 1, name: 1 });

  const counts = await Task.aggregate([
    { $match: { assignedTo: { $in: users.map((u) => u._id) }, status: { $ne: 'completed' } } },
    { $group: { _id: '$assignedTo', openTasks: { $sum: 1 } } },
  ]);
  const openByUser = new Map(counts.map((c) => [c._id.toString(), c.openTasks]));

  sendSuccess(res, {
    data: {
      users: users.map((u) => ({ ...u.toJSON(), openTasks: openByUser.get(u._id.toString()) || 0 })),
    },
  });
}

export async function createUser(req, res) {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw ApiError.badRequest('Name, email and password are required');
  assertAllowedEmail(email);

  const user = await User.create({ name, email, password, role });
  sendSuccess(res, { statusCode: 201, message: 'User created successfully', data: { user } });
}

export async function updateUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  const { name, role } = req.body;
  let transferred = 0;

  if (role !== undefined && role !== user.role) {
    if (user._id.equals(req.user._id)) throw ApiError.badRequest('You cannot change your own role');
    if (role === ROLES.ADMIN) {
      const openTasks = await Task.countDocuments({ assignedTo: user._id, status: { $ne: 'completed' } });
      if (openTasks) throw ApiError.badRequest('Reassign this user\'s open tasks before making them an admin');
    }
    user.role = role;
  }
  if (name !== undefined) user.name = name;

  await user.save();

  if (user.role === ROLES.EMPLOYEE) {
    const result = await Task.updateMany({ createdBy: user._id }, { createdBy: req.user._id });
    transferred = result.modifiedCount;
  }

  const message = transferred
    ? `User updated successfully. ${transferred} task(s) they created are now owned by you`
    : 'User updated successfully';
  sendSuccess(res, { message, data: { user, transferredTasks: transferred } });
}

export async function deleteUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  if (user._id.equals(req.user._id)) throw ApiError.badRequest('You cannot delete your own account');

  const openTasks = await Task.countDocuments({ assignedTo: user._id, status: { $ne: 'completed' } });
  if (openTasks) throw ApiError.badRequest(`This user still has ${openTasks} open task(s). Reassign them first.`);

  const finished = await Task.find({ assignedTo: user._id, status: 'completed' }).distinct('_id');
  await Activity.deleteMany({ task: { $in: finished } });
  await Task.deleteMany({ _id: { $in: finished } });
  await Task.updateMany({ createdBy: user._id }, { createdBy: req.user._id });
  await user.deleteOne();
  sendSuccess(res, { message: 'User deleted successfully', data: { id: user._id } });
}
