import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';

const failedAttempts = new Map();

const keyFor = (req) => `${req.ip}|${String(req.body?.email ?? '').toLowerCase().trim()}`;

function activeEntry(key) {
  const entry = failedAttempts.get(key);
  if (!entry) return null;
  if (Date.now() - entry.firstFailure > env.loginLockMinutes * 60 * 1000) {
    failedAttempts.delete(key);
    return null;
  }
  return entry;
}

export function limitLoginAttempts(req, res, next) {
  const entry = activeEntry(keyFor(req));
  if (entry && entry.count >= env.loginMaxAttempts) {
    const unlockAt = entry.firstFailure + env.loginLockMinutes * 60 * 1000;
    const minutesLeft = Math.max(Math.ceil((unlockAt - Date.now()) / 60000), 1);
    res.set('Retry-After', String(Math.ceil((unlockAt - Date.now()) / 1000)));
    throw new ApiError(429, `Too many failed login attempts. Try again in ${minutesLeft} minute(s).`);
  }
  next();
}

export function recordFailedLogin(req) {
  const key = keyFor(req);
  const entry = activeEntry(key);
  if (entry) entry.count += 1;
  else failedAttempts.set(key, { count: 1, firstFailure: Date.now() });
  return env.loginMaxAttempts - failedAttempts.get(key).count;
}

export function clearFailedLogins(req) {
  failedAttempts.delete(keyFor(req));
}
