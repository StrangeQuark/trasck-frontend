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
