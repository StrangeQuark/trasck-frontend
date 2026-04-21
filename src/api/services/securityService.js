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

  listWorkspaceRoles(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/roles', {
      path: { workspaceId },
    });
  },

  listWorkspaceRolePermissions(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/roles/permissions', {
      path: { workspaceId },
    });
  },

  createWorkspaceRole(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/roles', {
      path: { workspaceId },
      body: request,
    });
  },

  getWorkspaceRole(workspaceId, roleId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/roles/{roleId}', {
      path: { workspaceId, roleId },
    });
  },

  updateWorkspaceRole(workspaceId, roleId, request) {
    return api.request('patch', '/api/v1/workspaces/{workspaceId}/roles/{roleId}', {
      path: { workspaceId, roleId },
      body: request,
    });
  },

  archiveWorkspaceRole(workspaceId, roleId) {
    return api.request('delete', '/api/v1/workspaces/{workspaceId}/roles/{roleId}', {
      path: { workspaceId, roleId },
      responseType: 'void',
    });
  },

  previewWorkspaceRolePermissions(workspaceId, roleId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/roles/{roleId}/permission-preview', {
      path: { workspaceId, roleId },
      body: request,
    });
  },

  updateWorkspaceRolePermissions(workspaceId, roleId, request) {
    return api.request('put', '/api/v1/workspaces/{workspaceId}/roles/{roleId}/permissions', {
      path: { workspaceId, roleId },
      body: request,
    });
  },

  listWorkspaceRoleVersions(workspaceId, roleId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/roles/{roleId}/versions', {
      path: { workspaceId, roleId },
    });
  },

  rollbackWorkspaceRole(workspaceId, roleId, versionId) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/roles/{roleId}/versions/{versionId}/rollback', {
      path: { workspaceId, roleId, versionId },
    });
  },

  listProjectRoles(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/roles', {
      path: { projectId },
    });
  },

  listProjectRolePermissions(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/roles/permissions', {
      path: { projectId },
    });
  },

  createProjectRole(projectId, request) {
    return api.request('post', '/api/v1/projects/{projectId}/roles', {
      path: { projectId },
      body: request,
    });
  },

  getProjectRole(projectId, roleId) {
    return api.request('get', '/api/v1/projects/{projectId}/roles/{roleId}', {
      path: { projectId, roleId },
    });
  },

  updateProjectRole(projectId, roleId, request) {
    return api.request('patch', '/api/v1/projects/{projectId}/roles/{roleId}', {
      path: { projectId, roleId },
      body: request,
    });
  },

  archiveProjectRole(projectId, roleId) {
    return api.request('delete', '/api/v1/projects/{projectId}/roles/{roleId}', {
      path: { projectId, roleId },
      responseType: 'void',
    });
  },

  previewProjectRolePermissions(projectId, roleId, request) {
    return api.request('post', '/api/v1/projects/{projectId}/roles/{roleId}/permission-preview', {
      path: { projectId, roleId },
      body: request,
    });
  },

  updateProjectRolePermissions(projectId, roleId, request) {
    return api.request('put', '/api/v1/projects/{projectId}/roles/{roleId}/permissions', {
      path: { projectId, roleId },
      body: request,
    });
  },

  listProjectRoleVersions(projectId, roleId) {
    return api.request('get', '/api/v1/projects/{projectId}/roles/{roleId}/versions', {
      path: { projectId, roleId },
    });
  },

  rollbackProjectRole(projectId, roleId, versionId) {
    return api.request('post', '/api/v1/projects/{projectId}/roles/{roleId}/versions/{versionId}/rollback', {
      path: { projectId, roleId, versionId },
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

  getPublicProject(projectId) {
    return api.request('get', '/api/v1/public/projects/{projectId}', {
      path: { projectId },
    });
  },

  listPublicProjectWorkItems(projectId, query = {}) {
    return api.request('get', '/api/v1/public/projects/{projectId}/work-items', {
      path: { projectId },
      query,
    });
  },

  getPublicProjectWorkItem(projectId, workItemId) {
    return api.request('get', '/api/v1/public/projects/{projectId}/work-items/{workItemId}', {
      path: { projectId, workItemId },
    });
  },
});
