import { useState } from 'react';
import { FiArrowRight, FiDatabase, FiEye } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';

export const SetupPage = ({ context }) => {
  const [form, setForm] = useState(defaultSetupForm);
  const [setupResult, setSetupResult] = useState(null);
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
      return created;
    }, 'Setup complete');
    if (setup) {
      setSetupResult(setup);
      context.setWorkspaceId(setup?.workspace?.id || '');
      context.setProjectId(setup?.project?.id || '');
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
      <Panel title="Setup Result" icon={<FiEye />}>
        <JsonPreview value={setupResult} />
      </Panel>
    </div>
  );
};
