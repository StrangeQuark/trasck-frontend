export const createImportsService = (api) => ({
  listJobs(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/import-jobs', {
      path: { workspaceId },
    });
  },

  createJob(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/import-jobs', {
      path: { workspaceId },
      body: request,
    });
  },

  listMappingTemplates(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/import-mapping-templates', {
      path: { workspaceId },
    });
  },

  createMappingTemplate(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/import-mapping-templates', {
      path: { workspaceId },
      body: request,
    });
  },

  updateMappingTemplate(mappingTemplateId, request) {
    return api.request('patch', '/api/v1/import-mapping-templates/{mappingTemplateId}', {
      path: { mappingTemplateId },
      body: request,
    });
  },

  deleteMappingTemplate(mappingTemplateId) {
    return api.request('delete', '/api/v1/import-mapping-templates/{mappingTemplateId}', {
      path: { mappingTemplateId },
    });
  },

  getJob(importJobId) {
    return api.request('get', '/api/v1/import-jobs/{importJobId}', {
      path: { importJobId },
    });
  },

  parse(importJobId, request) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/parse', {
      path: { importJobId },
      body: request,
    });
  },

  materialize(importJobId, request) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/materialize', {
      path: { importJobId },
      body: request,
    });
  },

  listRecords(importJobId) {
    return api.request('get', '/api/v1/import-jobs/{importJobId}/records', {
      path: { importJobId },
    });
  },

  createRecord(importJobId, request) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/records', {
      path: { importJobId },
      body: request,
    });
  },

  start(importJobId) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/start', {
      path: { importJobId },
    });
  },

  complete(importJobId) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/complete', {
      path: { importJobId },
    });
  },

  fail(importJobId) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/fail', {
      path: { importJobId },
    });
  },

  cancel(importJobId) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/cancel', {
      path: { importJobId },
    });
  },
});
