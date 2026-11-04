import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateId } from '../middleware/validateId.js';
import { ROLES } from '../config/roles.js';

const router = Router();

router.use(protect);

router
  .route('/')
  .get(authorize(ROLES.ADMIN, ROLES.MANAGER), getUsers)
  .post(authorize(ROLES.ADMIN), createUser);

router
  .route('/:id')
  .all(authorize(ROLES.ADMIN), validateId('id'))
  .patch(updateUser)
  .delete(deleteUser);

export default router;
