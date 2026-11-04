import { Router } from 'express';
import { getActivity, addComment, deleteComment } from '../controllers/activityController.js';
import { validateId } from '../middleware/validateId.js';
import { loadAccessibleTask } from '../middleware/taskAccess.js';

const router = Router({ mergeParams: true });

router.use(validateId('id'), loadAccessibleTask);

router.get('/activity', getActivity);
router.post('/comments', addComment);
router.delete('/comments/:commentId', validateId('commentId'), deleteComment);

export default router;
