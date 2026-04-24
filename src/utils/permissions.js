export const hasPermissionKey = (permissionKeys, permissionKey) => {
  if (!permissionKey) {
    return false;
  }
  const keys = Array.isArray(permissionKeys) ? permissionKeys : [];
  return keys.includes('*') || keys.includes(permissionKey);
};

export const hasAnyPermissionKey = (permissionKeys, permissionKeysToCheck) =>
  (permissionKeysToCheck || []).some((permissionKey) => hasPermissionKey(permissionKeys, permissionKey));

export const selectedWorkspaceContext = (context, workspaceId = context.workspaceId) =>
  context.workspaceOptions.find((workspace) => workspace.id === workspaceId) || null;

export const selectedProjectContext = (context, projectId = context.projectId) =>
  context.projectOptions.find((project) => project.id === projectId) || null;

export const workspacePermissionKeys = (context, workspaceId = context.workspaceId) =>
  selectedWorkspaceContext(context, workspaceId)?.permissionKeys || [];

export const projectPermissionKeys = (context, projectId = context.projectId) =>
  selectedProjectContext(context, projectId)?.permissionKeys || [];
