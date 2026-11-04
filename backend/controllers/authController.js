import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { signToken } from '../utils/token.js';
import { assertAllowedEmail } from '../utils/email.js';
import { env } from '../config/env.js';
import { ROLES } from '../config/roles.js';

export async function register(req, res) {
  if (!env.allowRegistration) throw ApiError.forbidden('Public registration is disabled');

  const { name, email, password } = req.body;
  if (!name || !email || !password) throw ApiError.badRequest('Name, email and password are required');
  assertAllowedEmail(email);

  const user = await User.create({ name, email, password, role: ROLES.EMPLOYEE });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: { token: signToken(user), user },
  });
}

export function getAuthConfig(_req, res) {
  sendSuccess(res, {
    data: { allowRegistration: env.allowRegistration, emailDomain: env.emailDomain || null },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  sendSuccess(res, {
    message: 'Logged in successfully',
    data: { token: signToken(user), user },
  });
}

export async function getMe(req, res) {
  sendSuccess(res, { data: { user: req.user } });
}

export async function updateMe(req, res) {
  const { name, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (name !== undefined) user.name = name;

  if (newPassword) {
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      throw ApiError.badRequest('Current password is incorrect');
    }
    user.password = newPassword;
  }

  await user.save();
  sendSuccess(res, { message: 'Profile updated successfully', data: { user } });
}
