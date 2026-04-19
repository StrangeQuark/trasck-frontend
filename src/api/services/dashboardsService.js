export const createDashboardsService = (api) => ({
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
});
