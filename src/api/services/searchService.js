export const createSearchService = (api) => ({
  listSavedFilters(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/saved-filters', {
      path: { workspaceId },
    });
  },

  listProjectSavedFilters(projectId) {
    return api.request('get', '/api/v1/projects/{projectId}/saved-filters', {
      path: { projectId },
    });
  },

  createSavedFilter(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/saved-filters', {
      path: { workspaceId },
      body: request,
    });
  },

  executeSavedFilter(savedFilterId, query = {}) {
    return api.request('get', '/api/v1/saved-filters/{savedFilterId}/work-items', {
      path: { savedFilterId },
      query,
    });
  },

  listSavedViews(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/personalization/views', {
      path: { workspaceId },
    });
  },

  createSavedView(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/personalization/views', {
      path: { workspaceId },
      body: request,
    });
  },
});
