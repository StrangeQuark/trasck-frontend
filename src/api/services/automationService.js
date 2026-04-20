export const createAutomationService = (api) => ({
  listNotifications(workspaceId, query = {}) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/notifications', {
      path: { workspaceId },
      query,
    });
  },

  markNotificationRead(notificationId) {
    return api.request('patch', '/api/v1/notifications/{notificationId}/read', {
      path: { notificationId },
    });
  },

  listPreferences(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/notification-preferences', {
      path: { workspaceId },
    });
  },

  upsertPreference(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/notification-preferences', {
      path: { workspaceId },
      body: request,
    });
  },

  listDefaultPreferences(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/notification-defaults', {
      path: { workspaceId },
    });
  },

  upsertDefaultPreference(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/notification-defaults', {
      path: { workspaceId },
      body: request,
    });
  },

  listRules(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/automation-rules', {
      path: { workspaceId },
    });
  },

  createRule(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/automation-rules', {
      path: { workspaceId },
      body: request,
    });
  },

  createCondition(ruleId, request) {
    return api.request('post', '/api/v1/automation-rules/{ruleId}/conditions', {
      path: { ruleId },
      body: request,
    });
  },

  createAction(ruleId, request) {
    return api.request('post', '/api/v1/automation-rules/{ruleId}/actions', {
      path: { ruleId },
      body: request,
    });
  },

  executeRule(ruleId, request) {
    return api.request('post', '/api/v1/automation-rules/{ruleId}/execute', {
      path: { ruleId },
      body: request,
    });
  },

  listJobs(ruleId) {
    return api.request('get', '/api/v1/automation-rules/{ruleId}/jobs', {
      path: { ruleId },
    });
  },

  getJob(jobId) {
    return api.request('get', '/api/v1/automation-jobs/{jobId}', {
      path: { jobId },
    });
  },

  runJob(jobId) {
    return api.request('post', '/api/v1/automation-jobs/{jobId}/run', {
      path: { jobId },
    });
  },

  runQueuedJobs(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/automation-jobs/run-queued', {
      path: { workspaceId },
      body: request,
    });
  },

  listWebhooks(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/webhooks', {
      path: { workspaceId },
    });
  },

  createWebhook(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/webhooks', {
      path: { workspaceId },
      body: request,
    });
  },

  listWebhookDeliveries(webhookId) {
    return api.request('get', '/api/v1/webhooks/{webhookId}/deliveries', {
      path: { webhookId },
    });
  },

  processWebhookDeliveries(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/webhook-deliveries/process', {
      path: { workspaceId },
      body: request,
    });
  },
});
