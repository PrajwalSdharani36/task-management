import ApiError from './ApiError.js';
import { env } from '../config/env.js';

export function assertAllowedEmail(email) {
  if (!env.emailDomain) return;
  const domain = String(email).trim().toLowerCase().split('@')[1];
  if (domain !== env.emailDomain) {
    throw ApiError.badRequest(`Please use your @${env.emailDomain} email address`);
  }
}
