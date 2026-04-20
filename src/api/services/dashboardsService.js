export const createDashboardsService = (api) => ({
  list(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/dashboards', {
      path: { workspaceId },
    });
  },

  listByProject(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/dashboards', {
      path: { projectId },
    });
  },

  create(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/dashboards', {
      path: { workspaceId },
      body: request,
    });
  },

  createWidget(dashboardId, request) {
    return api.request('post', '/api/v1/dashboards/{dashboardId}/widgets', {
      path: { dashboardId },
      body: request,
    });
  },

  render(dashboardId, query = {}) {
    return api.request('get', '/api/v1/dashboards/{dashboardId}/render', {
      path: { dashboardId },
      query,
    });
  },

  projectSummary(projectId, query = {}) {
    return api.request('get', '/api/v1/reports/projects/{projectId}/dashboard-summary', {
      path: { projectId },
      query,
    });
  },

  workspaceSummary(workspaceId, query = {}) {
    return api.request('get', '/api/v1/reports/workspaces/{workspaceId}/dashboard-summary', {
      path: { workspaceId },
      query,
    });
  },

  projectImportCompletions(projectId, query = {}) {
    return api.request('get', '/api/v1/reports/projects/{projectId}/imports/completions', {
      path: { projectId },
      query,
    });
  },

  workspaceImportCompletions(workspaceId, query = {}) {
    return api.request('get', '/api/v1/reports/workspaces/{workspaceId}/imports/completions', {
      path: { workspaceId },
      query,
    });
  },
});
