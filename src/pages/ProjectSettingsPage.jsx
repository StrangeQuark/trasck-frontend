import { useEffect, useState } from 'react';
import { FiExternalLink, FiRefreshCw, FiSave, FiShield } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { RoleManagementPanel } from '../components/RoleManagementPanel';
import { SelectField } from '../components/SelectField';
import { SummaryRows } from '../components/SummaryRows';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';
import { DEFAULT_POLICY_FORM, policyToForm, projectPolicyRequest } from '../utils/securityPolicies';

const VISIBILITY_OPTIONS = ['private', 'workspace', 'public'];

export const ProjectSettingsPage = ({ context }) => {
  const [policy, setPolicy] = useState(null);
  const [policyForm, setPolicyForm] = useState(DEFAULT_POLICY_FORM);
  const action = useApiAction(context.addToast);
  const publicPreviewPath = context.projectId ? `/public/projects/${context.projectId}` : '';

  const loadPolicy = async () => {
    if (!context.projectId) {
      return;
    }
    const loaded = await action.run(() => context.services.security.getProjectSecurityPolicy(context.projectId));
    if (loaded) {
      setPolicy(loaded);
      setPolicyForm(policyToForm(loaded));
    }
  };

  useEffect(() => {
    if (context.projectId) {
      loadPolicy();
    }
  }, [context.projectId]);

  const savePolicy = async (event) => {
    event.preventDefault();
    if (policy?.visibility !== 'public' && policyForm.visibility === 'public') {
      const confirmed = window.confirm('Make this project public when workspace anonymous read is enabled?');
      if (!confirmed) {
        return;
      }
    }
    const saved = await action.run(
      () => context.services.security.updateProjectSecurityPolicy(context.projectId, projectPolicyRequest(policyForm)),
      'Project security policy saved',
    );
    if (saved) {
      setPolicy(saved);
      setPolicyForm(policyToForm(saved));
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Project Security Policy" icon={<FiShield />}>
        <form className="stack" onSubmit={savePolicy}>
          <SummaryRows rows={[
            ['Project', projectName(context)],
            ['Visibility', policy?.visibility || 'Unknown'],
            ['Workspace anonymous read', policy?.workspaceAnonymousReadEnabled ? 'Enabled' : 'Disabled'],
            ['Effective anonymous read', policy?.publicReadEnabled ? 'Enabled' : 'Blocked'],
            ['Workspace policy', policy?.workspaceCustomPolicy ? 'Custom' : 'Default'],
            ['Project policy', policy?.customPolicy ? 'Custom' : 'Inherited'],
          ]} />
          <SelectField
            label="Visibility"
            options={VISIBILITY_OPTIONS}
            value={policyForm.visibility || 'private'}
            onChange={(visibility) => setPolicyForm({ ...policyForm, visibility })}
          />
          <TextField label="Attachment max upload bytes" value={policyForm.attachmentMaxUploadBytes} onChange={(attachmentMaxUploadBytes) => setPolicyForm({ ...policyForm, attachmentMaxUploadBytes })} />
          <TextField label="Attachment max download bytes" value={policyForm.attachmentMaxDownloadBytes} onChange={(attachmentMaxDownloadBytes) => setPolicyForm({ ...policyForm, attachmentMaxDownloadBytes })} />
          <TextField label="Attachment content types" value={policyForm.attachmentAllowedContentTypes} onChange={(attachmentAllowedContentTypes) => setPolicyForm({ ...policyForm, attachmentAllowedContentTypes })} />
          <TextField label="Export max bytes" value={policyForm.exportMaxArtifactBytes} onChange={(exportMaxArtifactBytes) => setPolicyForm({ ...policyForm, exportMaxArtifactBytes })} />
          <TextField label="Export content types" value={policyForm.exportAllowedContentTypes} onChange={(exportAllowedContentTypes) => setPolicyForm({ ...policyForm, exportAllowedContentTypes })} />
          <TextField label="Import max parse bytes" value={policyForm.importMaxParseBytes} onChange={(importMaxParseBytes) => setPolicyForm({ ...policyForm, importMaxParseBytes })} />
          <TextField label="Import content types" value={policyForm.importAllowedContentTypes} onChange={(importAllowedContentTypes) => setPolicyForm({ ...policyForm, importAllowedContentTypes })} />
          <div className="button-row wrap">
            <button className="secondary-button" disabled={action.pending || !context.projectId} onClick={loadPolicy} type="button"><FiRefreshCw />Refresh</button>
            {publicPreviewPath ? (
              <a className="secondary-button" href={publicPreviewPath} rel="noreferrer" target="_blank"><FiExternalLink />Public Preview</a>
            ) : null}
            <button className="primary-button" disabled={action.pending || !context.projectId} type="submit"><FiSave />Save</button>
          </div>
        </form>
      </Panel>

      <RoleManagementPanel
        context={context}
        onRolesChanged={loadPolicy}
        scope="project"
        scopeId={context.projectId}
      />

      <Panel title="Project Security State" icon={<FiShield />} wide>
        <ErrorLine message={action.error} />
        <JsonPreview title="Project Policy" value={policy} />
      </Panel>
    </div>
  );
};

const projectName = (context) => {
  const project = context.projectOptions.find((candidate) => candidate.id === context.projectId);
  return project ? `${project.key} - ${project.name}` : 'None selected';
};
