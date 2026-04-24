import { useEffect, useMemo, useState } from 'react';
import { FiArchive, FiRefreshCw, FiRotateCcw, FiSave, FiShield, FiUserPlus } from 'react-icons/fi';
import { ErrorLine } from './ErrorLine';
import { Field } from './Field';
import { JsonPreview } from './JsonPreview';
import { Panel } from './Panel';
import { StatusPill } from './StatusPill';
import { SummaryRows } from './SummaryRows';
import { TextField } from './TextField';
import { useApiAction } from '../hooks/useApiAction';

const defaultCreateForm = {
  key: 'custom_role',
  name: 'Custom Role',
  description: 'Custom role managed through Trasck.',
};

const roleToForm = (role) => ({
  name: role?.name || '',
  description: role?.description || '',
});

const methodNames = {
  workspace: {
    listRoles: 'listWorkspaceRoles',
    listPermissions: 'listWorkspaceRolePermissions',
    createRole: 'createWorkspaceRole',
    getRole: 'getWorkspaceRole',
    updateRole: 'updateWorkspaceRole',
    archiveRole: 'archiveWorkspaceRole',
    previewPermissions: 'previewWorkspaceRolePermissions',
    updatePermissions: 'updateWorkspaceRolePermissions',
    listVersions: 'listWorkspaceRoleVersions',
    rollback: 'rollbackWorkspaceRole',
  },
  project: {
    listRoles: 'listProjectRoles',
    listPermissions: 'listProjectRolePermissions',
    createRole: 'createProjectRole',
    getRole: 'getProjectRole',
    updateRole: 'updateProjectRole',
    archiveRole: 'archiveProjectRole',
    previewPermissions: 'previewProjectRolePermissions',
    updatePermissions: 'updateProjectRolePermissions',
    listVersions: 'listProjectRoleVersions',
    rollback: 'rollbackProjectRole',
  },
};

export const RoleManagementPanel = ({ context, onRolesChanged, scope, scopeId }) => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleForm, setRoleForm] = useState(roleToForm(null));
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [permissionKeys, setPermissionKeys] = useState([]);
  const [preview, setPreview] = useState(null);
  const [versions, setVersions] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const action = useApiAction(context.addToast);
  const methods = methodNames[scope];
  const titlePrefix = scope === 'workspace' ? 'Workspace' : 'Project';

  const groupedPermissions = useMemo(() => permissions.reduce((groups, permission) => {
    const category = permission.category || 'other';
    return {
      ...groups,
      [category]: [...(groups[category] || []), permission],
    };
  }, {}), [permissions]);

  const serviceCall = (method, ...args) => context.services.security[methods[method]](scopeId, ...args);

  const loadRoles = async (preferredRoleId = selectedRoleId) => {
    if (!scopeId) {
      setRoles([]);
      setPermissions([]);
      setSelectedRoleId('');
      setSelectedRole(null);
      setPermissionKeys([]);
      setPreview(null);
      setVersions([]);
      return;
    }
    const loaded = await action.run(() => Promise.all([
      serviceCall('listRoles'),
      serviceCall('listPermissions'),
    ]));
    if (loaded) {
      const [loadedRoles, loadedPermissions] = loaded;
      setRoles(loadedRoles || []);
      setPermissions(loadedPermissions || []);
      const nextRoleId = (loadedRoles || []).find((role) => role.id === preferredRoleId)?.id || loadedRoles?.[0]?.id || '';
      setSelectedRoleId(nextRoleId);
      if (nextRoleId) {
        await loadRole(nextRoleId);
      }
    }
  };

  const loadRole = async (roleId = selectedRoleId) => {
    if (!roleId) {
      return;
    }
    const loaded = await action.run(() => Promise.all([
      serviceCall('getRole', roleId),
      serviceCall('listVersions', roleId),
    ]));
    if (loaded) {
      const [role, roleVersions] = loaded;
      setSelectedRole(role || null);
      setSelectedRoleId(role?.id || roleId);
      setRoleForm(roleToForm(role));
      setPermissionKeys(role?.permissionKeys || []);
      setVersions(roleVersions || []);
      setPreview(null);
    }
  };

  useEffect(() => {
    loadRoles();
  }, [scopeId]);

  const createRole = async (event) => {
    event.preventDefault();
    const created = await action.run(
      () => serviceCall('createRole', {
        ...createForm,
        permissionKeys,
      }),
      `${titlePrefix} role created`,
    );
    if (created) {
      setLastResult(created);
      setCreateForm(defaultCreateForm);
      await loadRoles(created.id);
      onRolesChanged?.();
    }
  };

  const saveMetadata = async (event) => {
    event.preventDefault();
    const saved = await action.run(
      () => serviceCall('updateRole', selectedRoleId, roleForm),
      `${titlePrefix} role saved`,
    );
    if (saved) {
      setLastResult(saved);
      await loadRoles(saved.id);
      onRolesChanged?.();
    }
  };

  const previewPermissions = async () => {
    const loaded = await action.run(() => serviceCall('previewPermissions', selectedRoleId, { permissionKeys }));
    if (loaded) {
      setPreview(loaded);
      setLastResult(loaded);
    }
  };

  const savePermissions = async () => {
    if (!preview) {
      action.setError('Preview permission impact before saving');
      return;
    }
    if (!window.confirm(preview.confirmationText || 'Apply role permission changes?')) {
      return;
    }
    const saved = await action.run(
      () => serviceCall('updatePermissions', selectedRoleId, {
        permissionKeys,
        confirmed: true,
        previewToken: preview.previewToken,
      }),
      `${titlePrefix} role permissions saved`,
    );
    if (saved) {
      setLastResult(saved);
      await loadRole(saved.id);
      onRolesChanged?.();
    }
  };

  const archiveRole = async () => {
    if (!window.confirm(`Archive ${selectedRole?.name || selectedRoleId}?`)) {
      return;
    }
    await action.run(() => serviceCall('archiveRole', selectedRoleId), `${titlePrefix} role archived`);
    setSelectedRole(null);
    setSelectedRoleId('');
    setVersions([]);
    await loadRoles('');
    onRolesChanged?.();
  };

  const rollbackRole = async (version) => {
    if (!window.confirm(`Rollback ${selectedRole?.name || selectedRoleId} to version ${version.versionNumber}?`)) {
      return;
    }
    const rolledBack = await action.run(
      () => serviceCall('rollback', selectedRoleId, version.id),
      `${titlePrefix} role rolled back`,
    );
    if (rolledBack) {
      setLastResult(rolledBack);
      await loadRole(rolledBack.id);
      onRolesChanged?.();
    }
  };

  const togglePermission = (key) => {
    setPreview(null);
    setPermissionKeys((current) => (current.includes(key)
      ? current.filter((value) => value !== key)
      : [...current, key].sort()));
  };

  return (
    <Panel title={`${titlePrefix} Roles`} icon={<FiShield />} wide>
      <div className="stack">
        <SummaryRows rows={[
          [titlePrefix, scopeId],
          ['Loaded roles', roles.length],
          ['Loaded permissions', permissions.length],
          ['Selected role', selectedRole?.name || selectedRoleId],
        ]} />
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending || !scopeId} onClick={() => loadRoles()} type="button"><FiRefreshCw />Refresh roles</button>
          <button className="secondary-button" disabled={action.pending || !selectedRoleId} onClick={() => loadRole()} type="button"><FiRefreshCw />Refresh role</button>
        </div>
        <ErrorLine message={action.error} />

        <div className="two-column">
          <Field label={`${titlePrefix} role`}>
            <select aria-label={`${titlePrefix} role`} value={selectedRoleId} onChange={(event) => loadRole(event.target.value)}>
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name || role.key}
                </option>
              ))}
            </select>
          </Field>
          <SummaryRows rows={[
            ['Scope', selectedRole?.scope],
            ['System role', selectedRole?.systemRole ? 'Yes' : 'No'],
            ['Status', selectedRole?.status || 'active'],
            ['Members', selectedRole?.impactSummary?.activeMembers],
            ['Pending invites', selectedRole?.impactSummary?.pendingInvitations],
          ]} />
        </div>

        <form className="stack nested-form" onSubmit={saveMetadata}>
          <div className="two-column">
            <TextField label="Role name" value={roleForm.name} onChange={(name) => setRoleForm({ ...roleForm, name })} />
            <TextField label="Role description" value={roleForm.description} onChange={(description) => setRoleForm({ ...roleForm, description })} />
          </div>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending || !selectedRoleId} type="submit"><FiSave />Save role</button>
            <button className="secondary-button danger" disabled={action.pending || !selectedRoleId} onClick={archiveRole} type="button"><FiArchive />Archive role</button>
          </div>
        </form>

        <form className="stack nested-form" onSubmit={createRole}>
          <div className="two-column">
            <TextField label="New role key" value={createForm.key} onChange={(key) => setCreateForm({ ...createForm, key })} />
            <TextField label="New role name" value={createForm.name} onChange={(name) => setCreateForm({ ...createForm, name })} />
            <TextField label="New role description" value={createForm.description} onChange={(description) => setCreateForm({ ...createForm, description })} />
          </div>
          <button className="secondary-button" disabled={action.pending || !scopeId} type="submit"><FiUserPlus />Create role from checked permissions</button>
        </form>

        <div className="data-columns two">
          <div className="stack">
            {Object.entries(groupedPermissions).map(([category, rows]) => (
              <fieldset className="nested-form" key={category}>
                <legend>{category}</legend>
                {rows.map((permission) => (
                  <label className="checkbox-row" key={permission.id}>
                    <input
                      checked={permissionKeys.includes(permission.key)}
                      onChange={() => togglePermission(permission.key)}
                      type="checkbox"
                    />
                    <span>{permission.key}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="stack">
            <SummaryRows rows={[
              ['Added', preview?.addedPermissionKeys?.length],
              ['Removed', preview?.removedPermissionKeys?.length],
              ['Affected members', preview?.impactSummary?.activeMembers],
              ['Pending invites', preview?.impactSummary?.pendingInvitations],
              ['Removes admin permission', preview?.removesAdministrativePermission ? 'Yes' : 'No'],
            ]} />
            <div className="button-row wrap">
              <button className="secondary-button" disabled={action.pending || !selectedRoleId} onClick={previewPermissions} type="button"><FiShield />Preview impact</button>
              <button className="primary-button" disabled={action.pending || !selectedRoleId || !preview} onClick={savePermissions} type="button"><FiSave />Save confirmed permissions</button>
            </div>
            <JsonPreview title="Permission Preview" value={preview} />
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Change</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => (
                <tr key={version.id}>
                  <td>{version.versionNumber}</td>
                  <td>{version.changeType}</td>
                  <td><StatusPill active={version.status !== 'archived'} label={version.status || 'active'} /></td>
                  <td>{formatTimestamp(version.createdAt)}</td>
                  <td>
                    <button className="secondary-button" disabled={action.pending || !selectedRoleId} onClick={() => rollbackRole(version)} type="button"><FiRotateCcw />Rollback</button>
                  </td>
                </tr>
              ))}
              {versions.length === 0 ? (
                <tr><td colSpan="5">No role versions recorded yet</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <JsonPreview title={`${titlePrefix} Role State`} value={{ selectedRole, roles, lastResult }} />
      </div>
    </Panel>
  );
};

const formatTimestamp = (value) => {
  if (!value) {
    return 'None';
  }
  return value.replace('T', ' ').replace(/\.\d+Z?$/, 'Z');
};
