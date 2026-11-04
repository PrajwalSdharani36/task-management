import api from './api';

export const activityService = {
  list: (taskId) => api.get(`/tasks/${taskId}/activity`),
  addComment: (taskId, text) => api.post(`/tasks/${taskId}/comments`, { text }),
  removeComment: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`),
};
