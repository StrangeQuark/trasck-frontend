export const createProgramsService = (api) => ({
  list(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/programs', {
      path: { workspaceId },
    });
  },

  create(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/programs', {
      path: { workspaceId },
      body: request,
    });
  },

  get(programId) {
    return api.request('get', '/api/v1/programs/{programId}', {
      path: { programId },
    });
  },

  update(programId, request) {
    return api.request('patch', '/api/v1/programs/{programId}', {
      path: { programId },
      body: request,
    });
  },

  archive(programId) {
    return api.request('delete', '/api/v1/programs/{programId}', {
      path: { programId },
      responseType: 'void',
    });
  },

  listProjects(programId) {
    return api.request('get', '/api/v1/programs/{programId}/projects', {
      path: { programId },
    });
  },

  assignProject(programId, projectId, request) {
    return api.request('put', '/api/v1/programs/{programId}/projects/{projectId}', {
      path: { programId, projectId },
      body: request,
    });
  },

  removeProject(programId, projectId) {
    return api.request('delete', '/api/v1/programs/{programId}/projects/{projectId}', {
      path: { programId, projectId },
      responseType: 'void',
    });
  },

  dashboardSummary(programId, query = {}) {
    return api.request('get', '/api/v1/reports/programs/{programId}/dashboard-summary', {
      path: { programId },
      query,
    });
  },
});
