const reviewableStatuses = new Set(['running', 'completed', 'failed']);

export const importJobIsReviewable = (job) => {
  if (!job?.id) {
    return false;
  }
  if (Array.isArray(job.records) && job.records.length > 0) {
    return true;
  }
  return reviewableStatuses.has(job.status);
};

export const sourceTypeOptionsForProvider = (provider) => {
  if (provider === 'jira') {
    return ['issue'];
  }
  if (provider === 'rally') {
    return ['artifact'];
  }
  return ['row'];
};

export const selectedSourceType = (provider, current) => {
  const options = sourceTypeOptionsForProvider(provider);
  return options.includes(current) ? current : options[0];
};
