import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiDatabase } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { Panel } from '../components/Panel';
import { TextField } from '../components/TextField';
import { defaultSetupForm } from '../constants/appConstants';
import { useApiAction } from '../hooks/useApiAction';

export const SetupPage = ({ context }) => {
  const [form, setForm] = useState(defaultSetupForm);
  const [setupResult, setSetupResult] = useState(null);
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);

  const submitSetup = async (event) => {
    event.preventDefault();
    const setup = await action.run(async () => {
      const created = await context.services.auth.setup({
        adminUser: {
          email: form.email,
          username: form.username,
          displayName: form.displayName,
          password: form.password,
        },
        organization: {
          name: form.organizationName,
          slug: form.organizationSlug,
        },
        workspace: {
          name: form.workspaceName,
          key: form.workspaceKey,
          anonymousReadEnabled: false,
        },
        project: {
          name: form.projectName,
          key: form.projectKey,
          visibility: 'private',
        },
      });
      const session = await context.services.auth.login({
        identifier: form.email,
        password: form.password,
      });
      context.setCurrentUser(session?.user || null);
      await context.refreshSession?.();
      return created;
    }, 'Setup complete');
    if (setup) {
      setSetupResult(setup);
      context.setWorkspaceId(setup?.workspace?.id || '');
      context.setProjectId(setup?.project?.id || '');
      context.setSetupAvailable?.(false);
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Initial Setup" icon={<FiDatabase />} wide>
        <form className="stack" onSubmit={submitSetup}>
          <div className="two-column">
            <TextField label="Admin email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            <TextField label="Username" value={form.username} onChange={(username) => setForm({ ...form, username })} />
            <TextField label="Display name" value={form.displayName} onChange={(displayName) => setForm({ ...form, displayName })} />
            <TextField label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
            <TextField label="Organization" value={form.organizationName} onChange={(organizationName) => setForm({ ...form, organizationName })} />
            <TextField label="Slug" value={form.organizationSlug} onChange={(organizationSlug) => setForm({ ...form, organizationSlug })} />
            <TextField label="Workspace" value={form.workspaceName} onChange={(workspaceName) => setForm({ ...form, workspaceName })} />
            <TextField label="Workspace key" value={form.workspaceKey} onChange={(workspaceKey) => setForm({ ...form, workspaceKey: workspaceKey.toUpperCase() })} />
            <TextField label="Project" value={form.projectName} onChange={(projectName) => setForm({ ...form, projectName })} />
            <TextField label="Project key" value={form.projectKey} onChange={(projectKey) => setForm({ ...form, projectKey: projectKey.toUpperCase() })} />
          </div>
          <button className="primary-button" disabled={action.pending} type="submit">
            <FiArrowRight />
            Create
          </button>
          <ErrorLine message={action.error} />
        </form>
      </Panel>
      <Panel title="Setup status" icon={<FiCheckCircle />}>
        {setupResult ? (
          <div className="stack">
            <p className="success-text">Initial workspace and project are ready.</p>
            <dl className="summary-rows">
              <div>
                <dt>Workspace</dt>
                <dd>{setupResult.workspace?.name || 'Created'}</dd>
              </div>
              <div>
                <dt>Project</dt>
                <dd>{setupResult.project?.key ? `${setupResult.project.key} - ${setupResult.project.name}` : setupResult.project?.name || 'Created'}</dd>
              </div>
              <div>
                <dt>Admin</dt>
                <dd>{setupResult.adminUser?.displayName || setupResult.adminUser?.username || 'Created'}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="muted">Create the first organization, workspace, project, and administrator account.</p>
        )}
      </Panel>
    </div>
  );
};
