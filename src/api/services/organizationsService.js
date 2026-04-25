export const createOrganizationsService = (api) => ({
  listOrganizations() {
    return api.request('get', '/api/v1/organizations');
  },

  createOrganization(request) {
    return api.request('post', '/api/v1/organizations', { body: request });
  },

  getOrganization(organizationId) {
    return api.request('get', '/api/v1/organizations/{organizationId}', {
      path: { organizationId },
    });
  },

  updateOrganization(organizationId, request) {
    return api.request('patch', '/api/v1/organizations/{organizationId}', {
      path: { organizationId },
      body: request,
    });
  },

  archiveOrganization(organizationId) {
    return api.request('delete', '/api/v1/organizations/{organizationId}', {
      path: { organizationId },
      responseType: 'void',
    });
  },

  listWorkspaces(organizationId) {
    return api.request('get', '/api/v1/organizations/{organizationId}/workspaces', {
      path: { organizationId },
    });
  },

  createWorkspace(organizationId, request) {
    return api.request('post', '/api/v1/organizations/{organizationId}/workspaces', {
      path: { organizationId },
      body: request,
    });
  },

  getWorkspace(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}', {
      path: { workspaceId },
    });
  },

  updateWorkspace(workspaceId, request) {
    return api.request('patch', '/api/v1/workspaces/{workspaceId}', {
      path: { workspaceId },
      body: request,
    });
  },

  archiveWorkspace(workspaceId) {
    return api.request('delete', '/api/v1/workspaces/{workspaceId}', {
      path: { workspaceId },
      responseType: 'void',
    });
  },
});
