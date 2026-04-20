export const createConfigurationService = (api) => ({
  listCustomFields(workspaceId, query = {}) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/custom-fields', {
      path: { workspaceId },
      query,
    });
  },

  createCustomField(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/custom-fields', {
      path: { workspaceId },
      body: request,
    });
  },

  getCustomField(customFieldId) {
    return api.request('get', '/api/v1/custom-fields/{customFieldId}', {
      path: { customFieldId },
    });
  },

  updateCustomField(customFieldId, request) {
    return api.request('patch', '/api/v1/custom-fields/{customFieldId}', {
      path: { customFieldId },
      body: request,
    });
  },

  archiveCustomField(customFieldId) {
    return api.request('delete', '/api/v1/custom-fields/{customFieldId}', {
      path: { customFieldId },
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

  getFieldConfiguration(fieldConfigurationId) {
    return api.request('get', '/api/v1/field-configurations/{fieldConfigurationId}', {
      path: { fieldConfigurationId },
    });
  },

  updateFieldConfiguration(fieldConfigurationId, request) {
    return api.request('patch', '/api/v1/field-configurations/{fieldConfigurationId}', {
      path: { fieldConfigurationId },
      body: request,
    });
  },

  deleteFieldConfiguration(fieldConfigurationId) {
    return api.request('delete', '/api/v1/field-configurations/{fieldConfigurationId}', {
      path: { fieldConfigurationId },
    });
  },

  listCustomFieldContexts(customFieldId) {
    return api.request('get', '/api/v1/custom-fields/{customFieldId}/contexts', {
      path: { customFieldId },
    });
  },

  createCustomFieldContext(customFieldId, request) {
    return api.request('post', '/api/v1/custom-fields/{customFieldId}/contexts', {
      path: { customFieldId },
      body: request,
    });
  },

  updateCustomFieldContext(customFieldId, contextId, request) {
    return api.request('patch', '/api/v1/custom-fields/{customFieldId}/contexts/{contextId}', {
      path: { customFieldId, contextId },
      body: request,
    });
  },

  deleteCustomFieldContext(customFieldId, contextId) {
    return api.request('delete', '/api/v1/custom-fields/{customFieldId}/contexts/{contextId}', {
      path: { customFieldId, contextId },
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

  getScreen(screenId) {
    return api.request('get', '/api/v1/screens/{screenId}', {
      path: { screenId },
    });
  },

  updateScreen(screenId, request) {
    return api.request('patch', '/api/v1/screens/{screenId}', {
      path: { screenId },
      body: request,
    });
  },

  deleteScreen(screenId) {
    return api.request('delete', '/api/v1/screens/{screenId}', {
      path: { screenId },
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

  updateScreenField(screenId, screenFieldId, request) {
    return api.request('patch', '/api/v1/screens/{screenId}/fields/{screenFieldId}', {
      path: { screenId, screenFieldId },
      body: request,
    });
  },

  deleteScreenField(screenId, screenFieldId) {
    return api.request('delete', '/api/v1/screens/{screenId}/fields/{screenFieldId}', {
      path: { screenId, screenFieldId },
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

  updateScreenAssignment(screenId, assignmentId, request) {
    return api.request('patch', '/api/v1/screens/{screenId}/assignments/{assignmentId}', {
      path: { screenId, assignmentId },
      body: request,
    });
  },

  deleteScreenAssignment(screenId, assignmentId) {
    return api.request('delete', '/api/v1/screens/{screenId}/assignments/{assignmentId}', {
      path: { screenId, assignmentId },
    });
  },
});
