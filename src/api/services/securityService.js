export const createSecurityService = (api) => ({
  listSystemAdmins() {
    return api.request('get', '/api/v1/system-admins');
  },

  grantSystemAdmin(request) {
    return api.request('post', '/api/v1/system-admins', { body: request });
  },

  revokeSystemAdmin(userId) {
    return api.request('delete', '/api/v1/system-admins/{userId}', {
      path: { userId },
    });
  },

  listWorkspaceInvitations(workspaceId, query = {}) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/invitations', {
      path: { workspaceId },
      query,
    });
  },

  inviteWorkspaceUser(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/invitations', {
      path: { workspaceId },
      body: request,
    });
  },

  cancelWorkspaceInvitation(workspaceId, invitationId) {
    return api.request('delete', '/api/v1/workspaces/{workspaceId}/invitations/{invitationId}', {
      path: { workspaceId, invitationId },
    });
  },

  listWorkspaceUsers(workspaceId, query = {}) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/users', {
      path: { workspaceId },
      query,
    });
  },

  createWorkspaceUser(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/users', {
      path: { workspaceId },
      body: request,
    });
  },

  removeWorkspaceUser(workspaceId, userId) {
    return api.request('delete', '/api/v1/workspaces/{workspaceId}/users/{userId}', {
      path: { workspaceId, userId },
    });
  },

  getWorkspaceSecurityPolicy(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/security-policy', {
      path: { workspaceId },
    });
  },

  updateWorkspaceSecurityPolicy(workspaceId, request) {
    return api.request('patch', '/api/v1/workspaces/{workspaceId}/security-policy', {
      path: { workspaceId },
      body: request,
    });
  },

  getProjectSecurityPolicy(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/security-policy', {
      path: { projectId },
    });
  },

  updateProjectSecurityPolicy(projectId, request) {
    return api.request('patch', '/api/v1/projects/{projectId}/security-policy', {
      path: { projectId },
      body: request,
    });
  },
});
