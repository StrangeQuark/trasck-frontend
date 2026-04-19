export const createWorkItemsService = (api) => ({
  listByProject(projectId, query = {}) {
    return api.request('get', '/api/v1/projects/{projectId}/work-items', {
      path: { projectId },
      query,
    });
  },

  create(projectId, request) {
    return api.request('post', '/api/v1/projects/{projectId}/work-items', {
      path: { projectId },
      body: request,
    });
  },

  get(workItemId) {
    return api.request('get', '/api/v1/work-items/{workItemId}', {
      path: { workItemId },
    });
  },
});
