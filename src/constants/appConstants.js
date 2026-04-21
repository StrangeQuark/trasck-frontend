export const defaultSetupForm = {
  email: 'admin@trasck.local',
  username: 'admin',
  displayName: 'Trasck Admin',
  password: 'correct-horse-battery-staple',
  organizationName: 'Trasck Local',
  organizationSlug: 'trasck-local',
  workspaceName: 'Trasck Workspace',
  workspaceKey: 'TRASCK',
  projectName: 'Trasck Project',
  projectKey: 'TRASCK',
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
