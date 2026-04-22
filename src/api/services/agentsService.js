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

  listCredentials(providerId) {
    return api.request('get', '/api/v1/agent-providers/{providerId}/credentials', {
      path: { providerId },
    });
  },

  createCredential(providerId, request) {
    return api.request('post', '/api/v1/agent-providers/{providerId}/credentials', {
      path: { providerId },
      body: request,
    });
  },

  deactivateCredential(providerId, credentialId) {
    return api.request('post', '/api/v1/agent-providers/{providerId}/credentials/{credentialId}/deactivate', {
      path: { providerId, credentialId },
    });
  },

  reencryptCredentials(providerId) {
    return api.request('post', '/api/v1/agent-providers/{providerId}/credentials/reencrypt', {
      path: { providerId },
    });
  },

  rotateCallbackKey(providerId) {
    return api.request('post', '/api/v1/agent-providers/{providerId}/callback-keys/rotate', {
      path: { providerId },
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

  listCliRuns(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/agent-cli-runs', {
      path: { workspaceId },
    });
  },

  downloadCliRun(workspaceId, agentTaskId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/agent-cli-runs/{agentTaskId}/download', {
      path: { workspaceId, agentTaskId },
      responseType: 'blob',
    });
  },

  deleteCliRun(workspaceId, agentTaskId) {
    return api.request('delete', '/api/v1/workspaces/{workspaceId}/agent-cli-runs/{agentTaskId}', {
      path: { workspaceId, agentTaskId },
    });
  },

  pruneCliRuns(workspaceId, request = {}) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/agent-cli-runs/prune', {
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
