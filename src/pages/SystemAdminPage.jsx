import { useEffect, useState } from 'react';
import { FiRefreshCw, FiSave, FiShield, FiSlash, FiUserPlus } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { SummaryRows } from '../components/SummaryRows';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';
import { numberOrUndefined } from '../utils/forms';

const DEFAULT_POLICY_FORM = {
  attachmentMaxUploadBytes: '',
  attachmentMaxDownloadBytes: '',
  attachmentAllowedContentTypes: '',
  exportMaxArtifactBytes: '',
  exportAllowedContentTypes: '',
  importMaxParseBytes: '',
  importAllowedContentTypes: '',
};

export const SystemAdminPage = ({ context }) => {
  const [admins, setAdmins] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [grantUserId, setGrantUserId] = useState('');
  const [policyForm, setPolicyForm] = useState(DEFAULT_POLICY_FORM);
  const action = useApiAction(context.addToast);

  const loadAdmins = async () => {
    const loaded = await action.run(() => context.services.security.listSystemAdmins());
    if (loaded) {
      setAdmins(loaded || []);
    }
  };

  const loadPolicy = async () => {
    if (!context.workspaceId) {
      return;
    }
    const loaded = await action.run(() => context.services.security.getWorkspaceSecurityPolicy(context.workspaceId));
    if (loaded) {
      setPolicy(loaded);
      setPolicyForm(policyToForm(loaded));
    }
  };

  useEffect(() => {
    if (context.workspaceId) {
      loadPolicy();
    }
  }, [context.workspaceId]);

  const grantAdmin = async (event) => {
    event.preventDefault();
    const granted = await action.run(() => context.services.security.grantSystemAdmin({ userId: grantUserId }), 'System admin granted');
    if (granted) {
      setGrantUserId('');
      await loadAdmins();
    }
  };

  const revokeAdmin = async (userId) => {
    const revoked = await action.run(() => context.services.security.revokeSystemAdmin(userId), 'System admin revoked');
    if (revoked) {
      await loadAdmins();
    }
  };

  const savePolicy = async (event) => {
    event.preventDefault();
    const saved = await action.run(
      () => context.services.security.updateWorkspaceSecurityPolicy(context.workspaceId, policyRequest(policyForm)),
      'Security policy saved',
    );
    if (saved) {
      setPolicy(saved);
      setPolicyForm(policyToForm(saved));
    }
  };

  return (
    <div className="content-grid">
      <Panel title="System Admins" icon={<FiShield />}>
        <div className="stack">
          <form className="stack" onSubmit={grantAdmin}>
            <TextField label="User ID" value={grantUserId} onChange={setGrantUserId} />
            <div className="button-row wrap">
              <button className="secondary-button" disabled={action.pending} onClick={loadAdmins} type="button"><FiRefreshCw />Load</button>
              <button className="primary-button" disabled={action.pending || !grantUserId} type="submit"><FiUserPlus />Grant</button>
            </div>
          </form>
          <div className="work-list">
            {admins.map((admin) => (
              <article className="work-row" key={admin.id || admin.userId}>
                <span className="work-key">{admin.active ? 'active' : 'inactive'}</span>
                <span className="work-title">{admin.displayName || admin.username || admin.email || admin.userId}</span>
                <button className="icon-button danger" disabled={action.pending || !admin.active} onClick={() => revokeAdmin(admin.userId)} title="Revoke system admin" type="button"><FiSlash /></button>
              </article>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Workspace Security Policy" icon={<FiShield />}>
        <form className="stack" onSubmit={savePolicy}>
          <SummaryRows rows={[
            ['Workspace', context.workspaceId],
            ['Custom policy', policy?.customPolicy ? 'Yes' : 'No'],
          ]} />
          <TextField label="Attachment max upload bytes" value={policyForm.attachmentMaxUploadBytes} onChange={(attachmentMaxUploadBytes) => setPolicyForm({ ...policyForm, attachmentMaxUploadBytes })} />
          <TextField label="Attachment max download bytes" value={policyForm.attachmentMaxDownloadBytes} onChange={(attachmentMaxDownloadBytes) => setPolicyForm({ ...policyForm, attachmentMaxDownloadBytes })} />
          <TextField label="Attachment content types" value={policyForm.attachmentAllowedContentTypes} onChange={(attachmentAllowedContentTypes) => setPolicyForm({ ...policyForm, attachmentAllowedContentTypes })} />
          <TextField label="Export max bytes" value={policyForm.exportMaxArtifactBytes} onChange={(exportMaxArtifactBytes) => setPolicyForm({ ...policyForm, exportMaxArtifactBytes })} />
          <TextField label="Export content types" value={policyForm.exportAllowedContentTypes} onChange={(exportAllowedContentTypes) => setPolicyForm({ ...policyForm, exportAllowedContentTypes })} />
          <TextField label="Import max parse bytes" value={policyForm.importMaxParseBytes} onChange={(importMaxParseBytes) => setPolicyForm({ ...policyForm, importMaxParseBytes })} />
          <TextField label="Import content types" value={policyForm.importAllowedContentTypes} onChange={(importAllowedContentTypes) => setPolicyForm({ ...policyForm, importAllowedContentTypes })} />
          <div className="button-row wrap">
            <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadPolicy} type="button"><FiRefreshCw />Load</button>
            <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiSave />Save</button>
          </div>
        </form>
      </Panel>

      <Panel title="Security State" icon={<FiShield />} wide>
        <ErrorLine message={action.error} />
        <div className="data-columns">
          <JsonPreview title="System Admins" value={admins} />
          <JsonPreview title="Workspace Policy" value={policy} />
        </div>
      </Panel>
    </div>
  );
};

const policyToForm = (policy) => ({
  attachmentMaxUploadBytes: valueText(policy?.attachmentMaxUploadBytes),
  attachmentMaxDownloadBytes: valueText(policy?.attachmentMaxDownloadBytes),
  attachmentAllowedContentTypes: policy?.attachmentAllowedContentTypes || '',
  exportMaxArtifactBytes: valueText(policy?.exportMaxArtifactBytes),
  exportAllowedContentTypes: policy?.exportAllowedContentTypes || '',
  importMaxParseBytes: valueText(policy?.importMaxParseBytes),
  importAllowedContentTypes: policy?.importAllowedContentTypes || '',
});

const policyRequest = (form) => ({
  attachmentMaxUploadBytes: numberOrUndefined(form.attachmentMaxUploadBytes),
  attachmentMaxDownloadBytes: numberOrUndefined(form.attachmentMaxDownloadBytes),
  attachmentAllowedContentTypes: form.attachmentAllowedContentTypes || undefined,
  exportMaxArtifactBytes: numberOrUndefined(form.exportMaxArtifactBytes),
  exportAllowedContentTypes: form.exportAllowedContentTypes || undefined,
  importMaxParseBytes: numberOrUndefined(form.importMaxParseBytes),
  importAllowedContentTypes: form.importAllowedContentTypes || undefined,
});

const valueText = (value) => value === undefined || value === null ? '' : String(value);
