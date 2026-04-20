export const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
};

export const parseJsonOrThrow = (value) => {
  try {
    return JSON.parse(value || '{}');
  } catch {
    throw new Error('JSON is invalid');
  }
};

export const toJsonText = (value) => JSON.stringify(value ?? {}, null, 2);

export const pick = (record, keys) => keys.reduce((request, key) => {
  if (Object.prototype.hasOwnProperty.call(record, key)) {
    request[key] = record[key];
  }
  return request;
}, {});

export const csv = (value) => value.split(',').map((entry) => entry.trim()).filter(Boolean);

export const firstId = (records) => Array.isArray(records) && records.length > 0 ? records[0].id || '' : '';

export const numberOrUndefined = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return undefined;
  }
  return Number(value);
};

export const settingsToForm = (settings) => ({
  automationJobsEnabled: String(Boolean(settings.automationJobsEnabled)),
  webhookDeliveriesEnabled: String(Boolean(settings.webhookDeliveriesEnabled)),
  emailDeliveriesEnabled: String(Boolean(settings.emailDeliveriesEnabled)),
  importConflictResolutionEnabled: String(Boolean(settings.importConflictResolutionEnabled)),
  importReviewExportsEnabled: String(Boolean(settings.importReviewExportsEnabled)),
  automationLimit: String(settings.automationLimit ?? 25),
  webhookLimit: String(settings.webhookLimit ?? 25),
  emailLimit: String(settings.emailLimit ?? 25),
  importConflictResolutionLimit: String(settings.importConflictResolutionLimit ?? 10),
  importReviewExportLimit: String(settings.importReviewExportLimit ?? 10),
  webhookMaxAttempts: String(settings.webhookMaxAttempts ?? 3),
  emailMaxAttempts: String(settings.emailMaxAttempts ?? 3),
  webhookDryRun: String(settings.webhookDryRun ?? true),
  emailDryRun: String(settings.emailDryRun ?? true),
  workerRunRetentionEnabled: String(Boolean(settings.workerRunRetentionEnabled)),
  workerRunRetentionDays: String(settings.workerRunRetentionDays ?? ''),
  workerRunExportBeforePrune: String(settings.workerRunExportBeforePrune ?? true),
  workerRunPruningAutomaticEnabled: String(Boolean(settings.workerRunPruningAutomaticEnabled)),
  workerRunPruningIntervalMinutes: String(settings.workerRunPruningIntervalMinutes ?? 1440),
  workerRunPruningWindowStart: String(settings.workerRunPruningWindowStart ?? ''),
  workerRunPruningWindowEnd: String(settings.workerRunPruningWindowEnd ?? ''),
  agentDispatchAttemptRetentionEnabled: String(Boolean(settings.agentDispatchAttemptRetentionEnabled)),
  agentDispatchAttemptRetentionDays: String(settings.agentDispatchAttemptRetentionDays ?? 30),
  agentDispatchAttemptExportBeforePrune: String(settings.agentDispatchAttemptExportBeforePrune ?? true),
  agentDispatchAttemptPruningAutomaticEnabled: String(Boolean(settings.agentDispatchAttemptPruningAutomaticEnabled)),
  agentDispatchAttemptPruningIntervalMinutes: String(settings.agentDispatchAttemptPruningIntervalMinutes ?? 1440),
  agentDispatchAttemptPruningWindowStart: String(settings.agentDispatchAttemptPruningWindowStart ?? ''),
  agentDispatchAttemptPruningWindowEnd: String(settings.agentDispatchAttemptPruningWindowEnd ?? ''),
});

export const recordLabel = (record) => {
  const prefix = record.key || record.version || record.provider || record.channel || record.eventType || record.recipientEmail || '';
  const name = record.name || record.title || record.displayName || record.username || record.sourceId || record.status || record.subject || '';
  const label = [prefix, name].filter(Boolean).join(' - ');
  return label || record.id;
};
