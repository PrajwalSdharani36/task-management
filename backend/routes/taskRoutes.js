import { Router } from 'express';
import {
  getTasks,
  getTaskStats,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateId } from '../middleware/validateId.js';
import { loadAccessibleTask, requireTaskOwner } from '../middleware/taskAccess.js';
import { ROLES } from '../config/roles.js';
import activityRoutes from './activityRoutes.js';

const router = Router();

router.use(protect);

router.get('/stats', getTaskStats);

router
  .route('/')
  .get(getTasks)
  .post(authorize(ROLES.ADMIN, ROLES.MANAGER), createTask);

router
  .route('/:id')
  .all(validateId('id'), loadAccessibleTask)
  .get(getTask)
  .patch(updateTask)
  .delete(authorize(ROLES.ADMIN, ROLES.MANAGER), requireTaskOwner, deleteTask);

router.use('/:id', activityRoutes);

export default router;
