import { useState } from 'react';
import { FiCpu, FiDatabase, FiEye, FiPlus, FiRefreshCw, FiSend, FiUsers, FiX } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { Field } from '../components/Field';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { RecordSelect } from '../components/RecordSelect';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';

export const AgentsPage = ({ context }) => {
  const [providers, setProviders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [task, setTask] = useState(null);
  const [providerForm, setProviderForm] = useState({ providerKey: 'simulated', providerType: 'simulated', displayName: 'Simulated Agent', dispatchMode: 'simulated' });
  const [profileForm, setProfileForm] = useState({ providerId: '', displayName: 'Trasck Agent', username: 'trasck-agent', roleId: '', projectIds: '' });
  const [repositoryForm, setRepositoryForm] = useState({ provider: 'generic_git', name: 'Local repo', repositoryUrl: '', defaultBranch: 'main' });
  const [taskForm, setTaskForm] = useState({ workItemId: '', agentProfileId: '', repositoryConnectionIds: '', instructions: 'Review this work item and prepare an implementation plan.', message: 'Adding context from the frontend console.' });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.agents.listProviders(context.workspaceId),
      context.services.agents.listProfiles(context.workspaceId),
      context.services.agents.listRepositoryConnections(context.workspaceId),
      context.projectId ? context.services.workItems.listByProject(context.projectId, { limit: 50 }) : Promise.resolve({ items: [] }),
    ]));
    if (result) {
      const [providerRows, profileRows, repoRows, workItemPage] = result;
      setProviders(providerRows || []);
      setProfiles(profileRows || []);
      setRepositories(repoRows || []);
      setWorkItems(workItemPage?.items || []);
      if (!profileForm.providerId && firstId(providerRows)) {
        setProfileForm((current) => ({ ...current, providerId: firstId(providerRows) }));
      }
      if (!taskForm.agentProfileId && firstId(profileRows)) {
        setTaskForm((current) => ({ ...current, agentProfileId: firstId(profileRows) }));
      }
      if (!taskForm.workItemId && firstId(workItemPage?.items)) {
        setTaskForm((current) => ({ ...current, workItemId: firstId(workItemPage?.items) }));
      }
    }
  };

  const createProvider = async (event) => {
    event.preventDefault();
    const provider = await action.run(() => context.services.agents.createProvider(context.workspaceId, {
      ...providerForm,
      enabled: true,
    }), 'Provider created');
    if (provider) {
      setProfileForm({ ...profileForm, providerId: provider.id || profileForm.providerId });
      await load();
    }
  };

  const createProfile = async (event) => {
    event.preventDefault();
    const profile = await action.run(() => context.services.agents.createProfile(context.workspaceId, {
      providerId: profileForm.providerId,
      displayName: profileForm.displayName,
      username: profileForm.username,
      roleId: profileForm.roleId || undefined,
      projectIds: profileForm.projectIds.split(',').map((value) => value.trim()).filter(Boolean),
      status: 'active',
    }), 'Agent profile created');
    if (profile) {
      setTaskForm({ ...taskForm, agentProfileId: profile.id || taskForm.agentProfileId });
      await load();
    }
  };

  const createRepository = async (event) => {
    event.preventDefault();
    const repository = await action.run(() => context.services.agents.createRepositoryConnection(context.workspaceId, {
      ...repositoryForm,
      projectId: context.projectId || undefined,
      active: true,
    }), 'Repository connected');
    if (repository) {
      setTaskForm({ ...taskForm, repositoryConnectionIds: repository.id || '' });
      await load();
    }
  };

  const assign = async (event) => {
    event.preventDefault();
    const assigned = await action.run(() => context.services.agents.assign(taskForm.workItemId, {
      agentProfileId: taskForm.agentProfileId,
      repositoryConnectionIds: taskForm.repositoryConnectionIds.split(',').map((value) => value.trim()).filter(Boolean),
      requestPayload: { instructions: taskForm.instructions },
    }), 'Agent assigned');
    if (assigned) {
      setTask(assigned);
      context.setAgentTaskId(assigned.id || '');
    }
  };

  const loadTask = async () => {
    const loaded = await action.run(() => context.services.agents.getTask(context.agentTaskId));
    if (loaded) {
      setTask(loaded);
    }
  };

  const taskCommand = async (command, success) => {
    await action.run(() => command(context.agentTaskId), success);
    await loadTask();
  };

  return (
    <div className="content-grid">
      <Panel title="Provider" icon={<FiCpu />}>
        <form className="stack" onSubmit={createProvider}>
          <TextField label="Key" value={providerForm.providerKey} onChange={(providerKey) => setProviderForm({ ...providerForm, providerKey })} />
          <SelectField label="Type" value={providerForm.providerType} onChange={(providerType) => setProviderForm({ ...providerForm, providerType })} options={['simulated', 'codex', 'claude_code', 'generic_worker']} />
          <TextField label="Display name" value={providerForm.displayName} onChange={(displayName) => setProviderForm({ ...providerForm, displayName })} />
          <SelectField label="Dispatch" value={providerForm.dispatchMode} onChange={(dispatchMode) => setProviderForm({ ...providerForm, dispatchMode })} options={['simulated', 'polling', 'webhook_push']} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create provider</button>
        </form>
      </Panel>
      <Panel title="Profile" icon={<FiUsers />}>
        <form className="stack" onSubmit={createProfile}>
          <RecordSelect label="Provider" records={providers} value={profileForm.providerId} onChange={(providerId) => setProfileForm({ ...profileForm, providerId })} />
          <TextField label="Display name" value={profileForm.displayName} onChange={(displayName) => setProfileForm({ ...profileForm, displayName })} />
          <TextField label="Username" value={profileForm.username} onChange={(username) => setProfileForm({ ...profileForm, username })} />
          <TextField label="Role ID" value={profileForm.roleId} onChange={(roleId) => setProfileForm({ ...profileForm, roleId })} />
          <TextField label="Project IDs" value={profileForm.projectIds} onChange={(projectIds) => setProfileForm({ ...profileForm, projectIds })} />
          <button className="primary-button" disabled={action.pending || !profileForm.providerId} type="submit"><FiPlus />Create profile</button>
        </form>
      </Panel>
      <Panel title="Repository" icon={<FiDatabase />}>
        <form className="stack" onSubmit={createRepository}>
          <SelectField label="Provider" value={repositoryForm.provider} onChange={(provider) => setRepositoryForm({ ...repositoryForm, provider })} options={['generic_git', 'github', 'gitlab']} />
          <TextField label="Name" value={repositoryForm.name} onChange={(name) => setRepositoryForm({ ...repositoryForm, name })} />
          <TextField label="URL" value={repositoryForm.repositoryUrl} onChange={(repositoryUrl) => setRepositoryForm({ ...repositoryForm, repositoryUrl })} />
          <TextField label="Branch" value={repositoryForm.defaultBranch} onChange={(defaultBranch) => setRepositoryForm({ ...repositoryForm, defaultBranch })} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Connect</button>
        </form>
      </Panel>
      <Panel title="Agent Task" icon={<FiSend />} wide>
        <form className="stack" onSubmit={assign}>
          <div className="two-column compact">
            <RecordSelect label="Work item" records={workItems} value={taskForm.workItemId} onChange={(workItemId) => setTaskForm({ ...taskForm, workItemId })} />
            <RecordSelect label="Agent profile" records={profiles} value={taskForm.agentProfileId} onChange={(agentProfileId) => setTaskForm({ ...taskForm, agentProfileId })} />
          </div>
          <RecordSelect label="Repository" records={repositories} value={taskForm.repositoryConnectionIds} onChange={(repositoryConnectionIds) => setTaskForm({ ...taskForm, repositoryConnectionIds })} includeBlank />
          <Field label="Instructions">
            <textarea value={taskForm.instructions} onChange={(event) => setTaskForm({ ...taskForm, instructions: event.target.value })} rows={4} />
          </Field>
          <button className="primary-button" disabled={action.pending || !taskForm.workItemId || !taskForm.agentProfileId} type="submit"><FiSend />Assign</button>
        </form>
        <div className="agent-command-strip">
          <TextField label="Task ID" value={context.agentTaskId} onChange={context.setAgentTaskId} />
          <TextField label="Message" value={taskForm.message} onChange={(message) => setTaskForm({ ...taskForm, message })} />
          <button className="secondary-button" disabled={action.pending || !context.agentTaskId} onClick={loadTask} type="button"><FiRefreshCw />Load</button>
          <button className="secondary-button" disabled={action.pending || !context.agentTaskId} onClick={() => taskCommand(context.services.agents.retry, 'Retry requested')} type="button">Retry</button>
          <button className="secondary-button" disabled={action.pending || !context.agentTaskId} onClick={() => taskCommand(context.services.agents.acceptResult, 'Result accepted')} type="button">Accept</button>
          <button className="icon-button danger" disabled={action.pending || !context.agentTaskId} onClick={() => taskCommand(context.services.agents.cancel, 'Task canceled')} title="Cancel" type="button"><FiX /></button>
        </div>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Agent Records" icon={<FiEye />} wide>
        <div className="button-row">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
        </div>
        <div className="data-columns">
          <JsonPreview title="Providers" value={providers} />
          <JsonPreview title="Profiles" value={profiles} />
          <JsonPreview title="Repositories" value={repositories} />
          <JsonPreview title="Work Items" value={workItems} />
          <JsonPreview title="Task" value={task} />
        </div>
      </Panel>
    </div>
  );
};
