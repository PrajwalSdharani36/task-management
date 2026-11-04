import Activity from '../models/Activity.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { ROLES } from '../config/roles.js';

const populateActivity = (query) =>
  query
    .populate('actor', 'name role')
    .populate('fromUser', 'name')
    .populate('toUser', 'name');

export async function getActivity(req, res) {
  const activity = await populateActivity(Activity.find({ task: req.task._id }).sort({ createdAt: 1 }));
  sendSuccess(res, { data: { activity } });
}

export async function addComment(req, res) {
  const text = String(req.body.text ?? '').trim();
  if (!text) throw ApiError.badRequest('Comment cannot be empty');

  const comment = await Activity.create({ task: req.task._id, actor: req.user._id, type: 'comment', text });
  await comment.populate('actor', 'name role');

  sendSuccess(res, { statusCode: 201, message: 'Comment added', data: { comment } });
}

export async function deleteComment(req, res) {
  const comment = await Activity.findOne({ _id: req.params.commentId, task: req.task._id, type: 'comment' });
  if (!comment) throw ApiError.notFound('Comment not found');

  const isAuthor = comment.actor.equals(req.user._id);
  if (!isAuthor && req.user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only delete your own comments');
  }

  await comment.deleteOne();
  sendSuccess(res, { message: 'Comment deleted', data: { id: comment._id } });
}
