export const defaultSetupForm = {
  email: '',
  username: '',
  displayName: '',
  password: '',
  organizationName: '',
  organizationSlug: '',
  workspaceName: '',
  workspaceKey: '',
  teamName: '',
  projectName: '',
  projectKey: '',
};

export const defaultSavedFilterQuery = {
  entityType: 'work_item',
  projectId: '',
  sort: [{ field: 'workspaceSequenceNumber', direction: 'asc' }],
  where: {
    op: 'and',
    conditions: [
      { field: 'title', operator: 'contains', value: 'story' },
    ],
  },
};
