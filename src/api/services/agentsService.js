export const createAgentsService = (api) => ({
  assign(workItemId, request) {
    return api.request('post', '/api/v1/work-items/{workItemId}/assign-agent', {
      path: { workItemId },
      body: request,
    });
  },

  getTask(taskId) {
    return api.request('get', '/api/v1/agent-tasks/{taskId}', {
      path: { taskId },
    });
  },

  addMessage(taskId, request) {
    return api.request('post', '/api/v1/agent-tasks/{taskId}/messages', {
      path: { taskId },
      body: request,
    });
  },

  requestChanges(taskId, request) {
    return api.request('post', '/api/v1/agent-tasks/{taskId}/request-changes', {
      path: { taskId },
      body: request,
    });
  },

  retry(taskId) {
    return api.request('post', '/api/v1/agent-tasks/{taskId}/retry', {
      path: { taskId },
    });
  },

  cancel(taskId) {
    return api.request('post', '/api/v1/agent-tasks/{taskId}/cancel', {
      path: { taskId },
    });
  },

  acceptResult(taskId) {
    return api.request('post', '/api/v1/agent-tasks/{taskId}/accept-result', {
      path: { taskId },
    });
  },
});
