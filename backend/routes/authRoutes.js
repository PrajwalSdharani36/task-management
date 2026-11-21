import { Router } from 'express';
import { register, login, getMe, updateMe, getAuthConfig } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { limitLoginAttempts } from '../middleware/loginLimiter.js';

const router = Router();

router.get('/config', getAuthConfig);
router.post('/register', register);
router.post('/login', limitLoginAttempts, login);
router.route('/me').get(protect, getMe).patch(protect, updateMe);

export default router;
