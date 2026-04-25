export const createProjectsService = (api) => ({
  listWorkspaceProjects(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/projects', {
      path: { workspaceId },
    });
  },

  createProject(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/projects', {
      path: { workspaceId },
      body: request,
    });
  },

  getProject(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}', {
      path: { projectId },
    });
  },

  updateProject(projectId, request) {
    return api.request('patch', '/api/v1/projects/{projectId}', {
      path: { projectId },
      body: request,
    });
  },

  archiveProject(projectId) {
    return api.request('delete', '/api/v1/projects/{projectId}', {
      path: { projectId },
      responseType: 'void',
    });
  },
});
