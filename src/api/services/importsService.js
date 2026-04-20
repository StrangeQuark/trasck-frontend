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

  getSettings(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/import-settings', {
      path: { workspaceId },
    });
  },

  updateSettings(workspaceId, request) {
    return api.request('patch', '/api/v1/workspaces/{workspaceId}/import-settings', {
      path: { workspaceId },
      body: request,
    });
  },

  listSamples(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/import-samples', {
      path: { workspaceId },
    });
  },

  createSampleJob(workspaceId, sampleKey, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/import-samples/{sampleKey}/jobs', {
      path: { workspaceId, sampleKey },
      body: request,
    });
  },

  listTransformPresets(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/import-transform-presets', {
      path: { workspaceId },
    });
  },

  createTransformPreset(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/import-transform-presets', {
      path: { workspaceId },
      body: request,
    });
  },

  getTransformPreset(presetId) {
    return api.request('get', '/api/v1/import-transform-presets/{presetId}', {
      path: { presetId },
    });
  },

  listTransformPresetVersions(presetId) {
    return api.request('get', '/api/v1/import-transform-presets/{presetId}/versions', {
      path: { presetId },
    });
  },

  cloneTransformPresetVersion(presetId, versionId, request) {
    return api.request('post', '/api/v1/import-transform-presets/{presetId}/versions/{versionId}/clone', {
      path: { presetId, versionId },
      body: request,
    });
  },

  previewCloneRetargetTransformPresetVersion(presetId, versionId, request) {
    return api.request('post', '/api/v1/import-transform-presets/{presetId}/versions/{versionId}/retarget-preview', {
      path: { presetId, versionId },
      body: request,
    });
  },

  cloneRetargetTransformPresetVersion(presetId, versionId, request) {
    return api.request('post', '/api/v1/import-transform-presets/{presetId}/versions/{versionId}/retarget', {
      path: { presetId, versionId },
      body: request,
    });
  },

  updateTransformPreset(presetId, request) {
    return api.request('patch', '/api/v1/import-transform-presets/{presetId}', {
      path: { presetId },
      body: request,
    });
  },

  deleteTransformPreset(presetId) {
    return api.request('delete', '/api/v1/import-transform-presets/{presetId}', {
      path: { presetId },
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

  listValueLookups(mappingTemplateId) {
    return api.request('get', '/api/v1/import-mapping-templates/{mappingTemplateId}/value-lookups', {
      path: { mappingTemplateId },
    });
  },

  createValueLookup(mappingTemplateId, request) {
    return api.request('post', '/api/v1/import-mapping-templates/{mappingTemplateId}/value-lookups', {
      path: { mappingTemplateId },
      body: request,
    });
  },

  updateValueLookup(mappingTemplateId, lookupId, request) {
    return api.request('patch', '/api/v1/import-mapping-templates/{mappingTemplateId}/value-lookups/{lookupId}', {
      path: { mappingTemplateId, lookupId },
      body: request,
    });
  },

  deleteValueLookup(mappingTemplateId, lookupId) {
    return api.request('delete', '/api/v1/import-mapping-templates/{mappingTemplateId}/value-lookups/{lookupId}', {
      path: { mappingTemplateId, lookupId },
    });
  },

  listTypeTranslations(mappingTemplateId) {
    return api.request('get', '/api/v1/import-mapping-templates/{mappingTemplateId}/type-translations', {
      path: { mappingTemplateId },
    });
  },

  createTypeTranslation(mappingTemplateId, request) {
    return api.request('post', '/api/v1/import-mapping-templates/{mappingTemplateId}/type-translations', {
      path: { mappingTemplateId },
      body: request,
    });
  },

  updateTypeTranslation(mappingTemplateId, translationId, request) {
    return api.request('patch', '/api/v1/import-mapping-templates/{mappingTemplateId}/type-translations/{translationId}', {
      path: { mappingTemplateId, translationId },
      body: request,
    });
  },

  deleteTypeTranslation(mappingTemplateId, translationId) {
    return api.request('delete', '/api/v1/import-mapping-templates/{mappingTemplateId}/type-translations/{translationId}', {
      path: { mappingTemplateId, translationId },
    });
  },

  listStatusTranslations(mappingTemplateId) {
    return api.request('get', '/api/v1/import-mapping-templates/{mappingTemplateId}/status-translations', {
      path: { mappingTemplateId },
    });
  },

  createStatusTranslation(mappingTemplateId, request) {
    return api.request('post', '/api/v1/import-mapping-templates/{mappingTemplateId}/status-translations', {
      path: { mappingTemplateId },
      body: request,
    });
  },

  updateStatusTranslation(mappingTemplateId, translationId, request) {
    return api.request('patch', '/api/v1/import-mapping-templates/{mappingTemplateId}/status-translations/{translationId}', {
      path: { mappingTemplateId, translationId },
      body: request,
    });
  },

  deleteStatusTranslation(mappingTemplateId, translationId) {
    return api.request('delete', '/api/v1/import-mapping-templates/{mappingTemplateId}/status-translations/{translationId}', {
      path: { mappingTemplateId, translationId },
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

  listMaterializationRuns(importJobId) {
    return api.request('get', '/api/v1/import-jobs/{importJobId}/materialization-runs', {
      path: { importJobId },
    });
  },

  rerunMaterialization(materializationRunId, request) {
    return api.request('post', '/api/v1/import-materialization-runs/{materializationRunId}/rerun', {
      path: { materializationRunId },
      body: request,
    });
  },

  listRecords(importJobId, filters = {}) {
    return api.request('get', '/api/v1/import-jobs/{importJobId}/records', {
      path: { importJobId },
      query: filters,
    });
  },

  listConflicts(importJobId) {
    return api.request('get', '/api/v1/import-jobs/{importJobId}/conflicts', {
      path: { importJobId },
    });
  },

  resolveConflict(recordId, request) {
    return api.request('post', '/api/v1/import-job-records/{recordId}/resolve-conflict', {
      path: { recordId },
      body: request,
    });
  },

  resolveConflicts(importJobId, request) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/conflicts/resolve', {
      path: { importJobId },
      body: request,
    });
  },

  previewResolveConflicts(importJobId, request) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/conflicts/resolve-preview', {
      path: { importJobId },
      body: request,
    });
  },

  createConflictResolutionJob(importJobId, request) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/conflicts/resolve-async', {
      path: { importJobId },
      body: request,
    });
  },

  listConflictResolutionJobs(importJobId) {
    return api.request('get', '/api/v1/import-jobs/{importJobId}/conflict-resolution-jobs', {
      path: { importJobId },
    });
  },

  listWorkspaceConflictResolutionJobs(workspaceId, query = {}) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/import-conflict-resolution-jobs', {
      path: { workspaceId },
      query,
    });
  },

  getConflictResolutionJob(jobId) {
    return api.request('get', '/api/v1/import-conflict-resolution-jobs/{jobId}', {
      path: { jobId },
    });
  },

  runConflictResolutionJob(jobId) {
    return api.request('post', '/api/v1/import-conflict-resolution-jobs/{jobId}/run', {
      path: { jobId },
    });
  },

  cancelConflictResolutionJob(jobId) {
    return api.request('post', '/api/v1/import-conflict-resolution-jobs/{jobId}/cancel', {
      path: { jobId },
    });
  },

  retryConflictResolutionJob(jobId) {
    return api.request('post', '/api/v1/import-conflict-resolution-jobs/{jobId}/retry', {
      path: { jobId },
    });
  },

  processConflictResolutionJobs(workspaceId, query = {}) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/import-conflict-resolution-jobs/process', {
      path: { workspaceId },
      query,
    });
  },

  createRecord(importJobId, request) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/records', {
      path: { importJobId },
      body: request,
    });
  },

  updateRecord(recordId, request) {
    return api.request('patch', '/api/v1/import-job-records/{recordId}', {
      path: { recordId },
      body: request,
    });
  },

  listRecordVersions(recordId) {
    return api.request('get', '/api/v1/import-job-records/{recordId}/versions', {
      path: { recordId },
    });
  },

  listRecordVersionDiffs(recordId) {
    return api.request('get', '/api/v1/import-job-records/{recordId}/version-diffs', {
      path: { recordId },
    });
  },

  listJobVersionDiffs(importJobId) {
    return api.request('get', '/api/v1/import-jobs/{importJobId}/version-diffs', {
      path: { importJobId },
    });
  },

  exportJobVersionDiffs(importJobId) {
    return api.request('get', '/api/v1/import-jobs/{importJobId}/version-diffs/export', {
      path: { importJobId },
    });
  },

  createJobVersionDiffExportJob(importJobId, request) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/version-diffs/export-jobs', {
      path: { importJobId },
      body: request,
    });
  },

  createReviewCsvExportJob(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/import-review/export-jobs', {
      path: { workspaceId },
      body: request,
    });
  },

  listExportJobs(workspaceId, query = {}) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/export-jobs', {
      path: { workspaceId },
      query,
    });
  },

  downloadExportJob(workspaceId, exportJobId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/export-jobs/{exportJobId}/download', {
      path: { workspaceId, exportJobId },
      responseType: 'blob',
    });
  },

  start(importJobId) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/start', {
      path: { importJobId },
    });
  },

  complete(importJobId, request) {
    return api.request('post', '/api/v1/import-jobs/{importJobId}/complete', {
      path: { importJobId },
      body: request,
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
