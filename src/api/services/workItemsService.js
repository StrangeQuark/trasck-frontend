export const createWorkItemsService = (api) => ({
  listByProject(projectId, query = {}) {
    return api.request('get', '/api/v1/projects/{projectId}/work-items', {
      path: { projectId },
      query,
    });
  },

  create(projectId, request) {
    return api.request('post', '/api/v1/projects/{projectId}/work-items', {
      path: { projectId },
      body: request,
    });
  },

  get(workItemId) {
    return api.request('get', '/api/v1/work-items/{workItemId}', {
      path: { workItemId },
    });
  },

  update(workItemId, request) {
    return api.request('patch', '/api/v1/work-items/{workItemId}', {
      path: { workItemId },
      body: request,
    });
  },

  listComments(workItemId) {
    return api.request('get', '/api/v1/work-items/{workItemId}/comments', {
      path: { workItemId },
    });
  },

  createComment(workItemId, request) {
    return api.request('post', '/api/v1/work-items/{workItemId}/comments', {
      path: { workItemId },
      body: request,
    });
  },

  updateComment(workItemId, commentId, request) {
    return api.request('patch', '/api/v1/work-items/{workItemId}/comments/{commentId}', {
      path: { workItemId, commentId },
      body: request,
    });
  },

  deleteComment(workItemId, commentId) {
    return api.request('delete', '/api/v1/work-items/{workItemId}/comments/{commentId}', {
      path: { workItemId, commentId },
      responseType: 'void',
    });
  },

  listLinks(workItemId) {
    return api.request('get', '/api/v1/work-items/{workItemId}/links', {
      path: { workItemId },
    });
  },

  createLink(workItemId, request) {
    return api.request('post', '/api/v1/work-items/{workItemId}/links', {
      path: { workItemId },
      body: request,
    });
  },

  deleteLink(workItemId, linkId) {
    return api.request('delete', '/api/v1/work-items/{workItemId}/links/{linkId}', {
      path: { workItemId, linkId },
      responseType: 'void',
    });
  },

  listWatchers(workItemId) {
    return api.request('get', '/api/v1/work-items/{workItemId}/watchers', {
      path: { workItemId },
    });
  },

  addWatcher(workItemId, request = {}) {
    return api.request('post', '/api/v1/work-items/{workItemId}/watchers', {
      path: { workItemId },
      body: request,
    });
  },

  removeWatcher(workItemId, userId) {
    return api.request('delete', '/api/v1/work-items/{workItemId}/watchers/{userId}', {
      path: { workItemId, userId },
      responseType: 'void',
    });
  },

  listWorkLogs(workItemId) {
    return api.request('get', '/api/v1/work-items/{workItemId}/work-logs', {
      path: { workItemId },
    });
  },

  createWorkLog(workItemId, request) {
    return api.request('post', '/api/v1/work-items/{workItemId}/work-logs', {
      path: { workItemId },
      body: request,
    });
  },

  updateWorkLog(workItemId, workLogId, request) {
    return api.request('patch', '/api/v1/work-items/{workItemId}/work-logs/{workLogId}', {
      path: { workItemId, workLogId },
      body: request,
    });
  },

  deleteWorkLog(workItemId, workLogId) {
    return api.request('delete', '/api/v1/work-items/{workItemId}/work-logs/{workLogId}', {
      path: { workItemId, workLogId },
      responseType: 'void',
    });
  },

  listWorkspaceLabels(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/labels', {
      path: { workspaceId },
    });
  },

  createWorkspaceLabel(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/labels', {
      path: { workspaceId },
      body: request,
    });
  },

  deleteWorkspaceLabel(workspaceId, labelId) {
    return api.request('delete', '/api/v1/workspaces/{workspaceId}/labels/{labelId}', {
      path: { workspaceId, labelId },
      responseType: 'void',
    });
  },

  listWorkItemLabels(workItemId) {
    return api.request('get', '/api/v1/work-items/{workItemId}/labels', {
      path: { workItemId },
    });
  },

  addLabel(workItemId, request) {
    return api.request('post', '/api/v1/work-items/{workItemId}/labels', {
      path: { workItemId },
      body: request,
    });
  },

  removeLabel(workItemId, labelId) {
    return api.request('delete', '/api/v1/work-items/{workItemId}/labels/{labelId}', {
      path: { workItemId, labelId },
      responseType: 'void',
    });
  },

  listAttachments(workItemId) {
    return api.request('get', '/api/v1/work-items/{workItemId}/attachments', {
      path: { workItemId },
    });
  },

  uploadAttachment(workItemId, { file, checksum = '', visibility = 'restricted' }) {
    const formData = new FormData();
    formData.append('file', file);
    if (checksum) {
      formData.append('checksum', checksum);
    }
    if (visibility) {
      formData.append('visibility', visibility);
    }
    return api.request('post', '/api/v1/work-items/{workItemId}/attachments/files', {
      path: { workItemId },
      body: formData,
    });
  },

  downloadAttachment(workItemId, attachmentId) {
    return api.request('get', '/api/v1/work-items/{workItemId}/attachments/{attachmentId}/download', {
      path: { workItemId, attachmentId },
      responseType: 'blob',
    });
  },

  deleteAttachment(workItemId, attachmentId) {
    return api.request('delete', '/api/v1/work-items/{workItemId}/attachments/{attachmentId}', {
      path: { workItemId, attachmentId },
      responseType: 'void',
    });
  },

  activity(workItemId, query = {}) {
    return api.request('get', '/api/v1/work-items/{workItemId}/activity', {
      path: { workItemId },
      query,
    });
  },
});
