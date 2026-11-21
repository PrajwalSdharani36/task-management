import 'dotenv/config';

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowRegistration: process.env.ALLOW_REGISTRATION !== 'false',
  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS) || 5,
  loginLockMinutes: Number(process.env.LOGIN_LOCK_MINUTES) || 15,
  emailDomain: (process.env.ALLOWED_EMAIL_DOMAIN ?? 'team6.dev').trim().toLowerCase().replace(/^@/, ''),
  isProduction: process.env.NODE_ENV === 'production',
};
