import { useEffect, useState } from 'react';
import { FiEye, FiKey, FiPlus, FiRefreshCw, FiSettings } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { RecordSelect } from '../components/RecordSelect';
import { SecretReveal } from '../components/SecretReveal';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';
import { csv } from '../utils/forms';

export const TokenAdminPage = ({ context }) => {
  const [personalTokens, setPersonalTokens] = useState([]);
  const [serviceTokens, setServiceTokens] = useState([]);
  const [workspaceRoles, setWorkspaceRoles] = useState([]);
  const [createdToken, setCreatedToken] = useState(null);
  const [personalForm, setPersonalForm] = useState({ name: 'API token', scopes: 'work_item.read,report.read', expiresAt: '' });
  const [serviceForm, setServiceForm] = useState({ name: 'Service token', username: 'service-user', displayName: 'Service User', roleId: '', scopes: 'work_item.read,agent.manage', expiresAt: '' });
  const action = useApiAction(context.addToast);
  const canManageUsers = context.hasWorkspacePermission('user.manage');

  const load = async () => {
    const personal = await action.run(() => context.services.auth.listPersonalTokens());
    if (personal) {
      setPersonalTokens(personal || []);
    }
    if (context.workspaceId && canManageUsers) {
      const result = await action.run(() => Promise.all([
        context.services.auth.listServiceTokens(context.workspaceId),
        context.services.security.listWorkspaceRoles(context.workspaceId),
      ]));
      if (result) {
        const [service, roles] = result;
        setServiceTokens(service || []);
        setWorkspaceRoles(roles || []);
        setServiceForm((current) => ({ ...current, roleId: current.roleId || roles?.[0]?.id || '' }));
      }
    } else {
      setServiceTokens([]);
      setWorkspaceRoles([]);
    }
  };

  useEffect(() => {
    load();
  }, [canManageUsers, context.workspaceId]);

  const createPersonal = async (event) => {
    event.preventDefault();
    const token = await action.run(() => context.services.auth.createPersonalToken({
      name: personalForm.name,
      scopes: csv(personalForm.scopes),
      expiresAt: personalForm.expiresAt || undefined,
    }), 'Personal token created');
    if (token) {
      setCreatedToken(token);
      await load();
    }
  };

  const createService = async (event) => {
    event.preventDefault();
    if (!canManageUsers) {
      action.setError('Your current workspace role cannot create service tokens');
      return;
    }
    const token = await action.run(() => context.services.auth.createServiceToken(context.workspaceId, {
      name: serviceForm.name,
      username: serviceForm.username,
      displayName: serviceForm.displayName,
      roleId: serviceForm.roleId,
      scopes: csv(serviceForm.scopes),
      expiresAt: serviceForm.expiresAt || undefined,
    }), 'Service token created');
    if (token) {
      setCreatedToken(token);
      await load();
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Personal Token" icon={<FiKey />}>
        <form className="stack" onSubmit={createPersonal}>
          <TextField label="Name" value={personalForm.name} onChange={(name) => setPersonalForm({ ...personalForm, name })} />
          <TextField label="Scopes" value={personalForm.scopes} onChange={(scopes) => setPersonalForm({ ...personalForm, scopes })} />
          <TextField label="Expires at" value={personalForm.expiresAt} onChange={(expiresAt) => setPersonalForm({ ...personalForm, expiresAt })} />
          <button className="primary-button" disabled={action.pending} type="submit"><FiPlus />Create token</button>
        </form>
      </Panel>
      {canManageUsers && (
      <Panel title="Service Token" icon={<FiSettings />}>
        <form className="stack" onSubmit={createService}>
          <TextField label="Name" value={serviceForm.name} onChange={(name) => setServiceForm({ ...serviceForm, name })} />
          <TextField label="Username" value={serviceForm.username} onChange={(username) => setServiceForm({ ...serviceForm, username })} />
          <TextField label="Display name" value={serviceForm.displayName} onChange={(displayName) => setServiceForm({ ...serviceForm, displayName })} />
          <RecordSelect label="Role" records={workspaceRoles} value={serviceForm.roleId} onChange={(roleId) => setServiceForm({ ...serviceForm, roleId })} />
          <TextField label="Scopes" value={serviceForm.scopes} onChange={(scopes) => setServiceForm({ ...serviceForm, scopes })} />
          <TextField label="Expires at" value={serviceForm.expiresAt} onChange={(expiresAt) => setServiceForm({ ...serviceForm, expiresAt })} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId || !serviceForm.roleId} type="submit"><FiPlus />Create service token</button>
        </form>
      </Panel>
      )}
      <Panel title="Tokens" icon={<FiEye />} wide>
        <div className="button-row">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Refresh</button>
        </div>
        <ErrorLine message={action.error} />
        <div className="data-columns">
          <SecretReveal
            label="New Token Value"
            prefix={createdToken?.tokenPrefix}
            value={createdToken?.token}
            onClear={() => setCreatedToken(null)}
          />
          <JsonPreview title="Personal" value={personalTokens} />
          <JsonPreview title="Service" value={serviceTokens} />
        </div>
      </Panel>
    </div>
  );
};
