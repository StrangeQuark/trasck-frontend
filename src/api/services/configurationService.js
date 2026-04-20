export const createConfigurationService = (api) => ({
  listCustomFields(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/custom-fields', {
      path: { workspaceId },
    });
  },

  createCustomField(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/custom-fields', {
      path: { workspaceId },
      body: request,
    });
  },

  listFieldConfigurations(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/field-configurations', {
      path: { workspaceId },
    });
  },

  createFieldConfiguration(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/field-configurations', {
      path: { workspaceId },
      body: request,
    });
  },

  createCustomFieldContext(customFieldId, request) {
    return api.request('post', '/api/v1/custom-fields/{customFieldId}/contexts', {
      path: { customFieldId },
      body: request,
    });
  },

  listScreens(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/screens', {
      path: { workspaceId },
    });
  },

  createScreen(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/screens', {
      path: { workspaceId },
      body: request,
    });
  },

  listScreenFields(screenId) {
    return api.request('get', '/api/v1/screens/{screenId}/fields', {
      path: { screenId },
    });
  },

  addScreenField(screenId, request) {
    return api.request('post', '/api/v1/screens/{screenId}/fields', {
      path: { screenId },
      body: request,
    });
  },

  listScreenAssignments(screenId) {
    return api.request('get', '/api/v1/screens/{screenId}/assignments', {
      path: { screenId },
    });
  },

  addScreenAssignment(screenId, request) {
    return api.request('post', '/api/v1/screens/{screenId}/assignments', {
      path: { screenId },
      body: request,
    });
  },
});
