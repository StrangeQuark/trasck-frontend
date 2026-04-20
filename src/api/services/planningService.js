export const createPlanningService = (api) => ({
  listTeams(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/teams', {
      path: { workspaceId },
    });
  },

  createTeam(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/teams', {
      path: { workspaceId },
      body: request,
    });
  },

  listProjectTeams(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/teams', {
      path: { projectId },
    });
  },

  assignProjectTeam(projectId, teamId, request) {
    return api.request('put', '/api/v1/projects/{projectId}/teams/{teamId}', {
      path: { projectId, teamId },
      body: request,
    });
  },

  listIterations(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/iterations', {
      path: { projectId },
    });
  },

  createIteration(projectId, request) {
    return api.request('post', '/api/v1/projects/{projectId}/iterations', {
      path: { projectId },
      body: request,
    });
  },

  commitIteration(iterationId, request) {
    return api.request('post', '/api/v1/iterations/{iterationId}/commit', {
      path: { iterationId },
      body: request,
    });
  },
});
