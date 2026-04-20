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

  getRule(ruleId) {
    return api.request('get', '/api/v1/automation-rules/{ruleId}', {
      path: { ruleId },
    });
  },

  updateRule(ruleId, request) {
    return api.request('patch', '/api/v1/automation-rules/{ruleId}', {
      path: { ruleId },
      body: request,
    });
  },

  deleteRule(ruleId) {
    return api.request('delete', '/api/v1/automation-rules/{ruleId}', {
      path: { ruleId },
    });
  },

  createCondition(ruleId, request) {
    return api.request('post', '/api/v1/automation-rules/{ruleId}/conditions', {
      path: { ruleId },
      body: request,
    });
  },

  updateCondition(ruleId, conditionId, request) {
    return api.request('patch', '/api/v1/automation-rules/{ruleId}/conditions/{conditionId}', {
      path: { ruleId, conditionId },
      body: request,
    });
  },

  deleteCondition(ruleId, conditionId) {
    return api.request('delete', '/api/v1/automation-rules/{ruleId}/conditions/{conditionId}', {
      path: { ruleId, conditionId },
    });
  },

  createAction(ruleId, request) {
    return api.request('post', '/api/v1/automation-rules/{ruleId}/actions', {
      path: { ruleId },
      body: request,
    });
  },

  updateAction(ruleId, actionId, request) {
    return api.request('patch', '/api/v1/automation-rules/{ruleId}/actions/{actionId}', {
      path: { ruleId, actionId },
      body: request,
    });
  },

  deleteAction(ruleId, actionId) {
    return api.request('delete', '/api/v1/automation-rules/{ruleId}/actions/{actionId}', {
      path: { ruleId, actionId },
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

  getWorkerSettings(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/automation-worker-settings', {
      path: { workspaceId },
    });
  },

  updateWorkerSettings(workspaceId, request) {
    return api.request('patch', '/api/v1/workspaces/{workspaceId}/automation-worker-settings', {
      path: { workspaceId },
      body: request,
    });
  },

  listWorkerRuns(workspaceId, query = {}) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/automation-worker-runs', {
      path: { workspaceId },
      query,
    });
  },

  exportWorkerRuns(workspaceId, query = {}) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/automation-worker-runs/export', {
      path: { workspaceId },
      query,
    });
  },

  pruneWorkerRuns(workspaceId, query = {}) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/automation-worker-runs/prune', {
      path: { workspaceId },
      query,
    });
  },

  listWorkerHealth(workspaceId, query = {}) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/automation-worker-health', {
      path: { workspaceId },
      query,
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

  updateWebhook(webhookId, request) {
    return api.request('patch', '/api/v1/webhooks/{webhookId}', {
      path: { webhookId },
      body: request,
    });
  },

  deleteWebhook(webhookId) {
    return api.request('delete', '/api/v1/webhooks/{webhookId}', {
      path: { webhookId },
    });
  },

  listWebhookDeliveries(webhookId) {
    return api.request('get', '/api/v1/webhooks/{webhookId}/deliveries', {
      path: { webhookId },
    });
  },

  getWebhookDelivery(deliveryId) {
    return api.request('get', '/api/v1/webhook-deliveries/{deliveryId}', {
      path: { deliveryId },
    });
  },

  retryWebhookDelivery(deliveryId) {
    return api.request('post', '/api/v1/webhook-deliveries/{deliveryId}/retry', {
      path: { deliveryId },
    });
  },

  cancelWebhookDelivery(deliveryId) {
    return api.request('post', '/api/v1/webhook-deliveries/{deliveryId}/cancel', {
      path: { deliveryId },
    });
  },

  processWebhookDeliveries(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/webhook-deliveries/process', {
      path: { workspaceId },
      body: request,
    });
  },

  listEmailDeliveries(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/email-deliveries', {
      path: { workspaceId },
    });
  },

  getEmailDelivery(deliveryId) {
    return api.request('get', '/api/v1/email-deliveries/{deliveryId}', {
      path: { deliveryId },
    });
  },

  retryEmailDelivery(deliveryId) {
    return api.request('post', '/api/v1/email-deliveries/{deliveryId}/retry', {
      path: { deliveryId },
    });
  },

  cancelEmailDelivery(deliveryId) {
    return api.request('post', '/api/v1/email-deliveries/{deliveryId}/cancel', {
      path: { deliveryId },
    });
  },

  processEmailDeliveries(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/email-deliveries/process', {
      path: { workspaceId },
      body: request,
    });
  },
});
