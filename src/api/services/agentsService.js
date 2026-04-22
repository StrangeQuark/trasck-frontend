export const createAgentsService = (api) => ({
  listProviders(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/agent-providers', {
      path: { workspaceId },
    });
  },

  createProvider(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/agent-providers', {
      path: { workspaceId },
      body: request,
    });
  },

  deactivateProvider(providerId) {
    return api.request('post', '/api/v1/agent-providers/{providerId}/deactivate', {
      path: { providerId },
    });
  },

  previewRuntime(providerId, request = {}) {
    return api.request('post', '/api/v1/agent-providers/{providerId}/runtime-preview', {
      path: { providerId },
      body: request,
    });
  },

  listDispatchAttempts(workspaceId, query = {}) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/agent-dispatch-attempts', {
      path: { workspaceId },
      query,
    });
  },

  exportDispatchAttempts(workspaceId, request = {}) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/agent-dispatch-attempts/export', {
      path: { workspaceId },
      body: request,
    });
  },

  pruneDispatchAttempts(workspaceId, request = {}) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/agent-dispatch-attempts/prune', {
      path: { workspaceId },
      body: request,
    });
  },

  listProfiles(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/agents', {
      path: { workspaceId },
    });
  },

  createProfile(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/agents', {
      path: { workspaceId },
      body: request,
    });
  },

  deactivateProfile(profileId) {
    return api.request('post', '/api/v1/agents/{profileId}/deactivate', {
      path: { profileId },
    });
  },

  listRepositoryConnections(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/repository-connections', {
      path: { workspaceId },
    });
  },

  createRepositoryConnection(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/repository-connections', {
      path: { workspaceId },
      body: request,
    });
  },

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
