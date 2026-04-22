import { useState } from 'react';
import { FiArchive, FiCpu, FiDatabase, FiDownload, FiEye, FiKey, FiPlus, FiRefreshCw, FiSend, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { Field } from '../components/Field';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { RecordSelect } from '../components/RecordSelect';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';
import { firstId } from '../utils/forms';

export const AgentsPage = ({ context }) => {
  const [providers, setProviders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [task, setTask] = useState(null);
  const [runtimePreview, setRuntimePreview] = useState(null);
  const [dispatchAttempts, setDispatchAttempts] = useState([]);
  const [cliRuns, setCliRuns] = useState([]);
  const [providerForm, setProviderForm] = useState({
    providerKey: 'simulated',
    providerType: 'simulated',
    displayName: 'Simulated Agent',
    dispatchMode: 'managed',
    runtimeMode: 'stub',
    externalExecutionEnabled: 'false',
    hostedApiBaseUrl: '',
    cliWorkerCommandProfile: '',
  });
  const [credentialForm, setCredentialForm] = useState({
    credentialType: 'codex_api_key',
    secret: '',
    authScheme: 'bearer',
    environmentVariable: 'CODEX_API_KEY',
    workerId: '',
    expiresAt: '',
  });
  const [profileForm, setProfileForm] = useState({ providerId: '', displayName: 'Trasck Agent', username: 'trasck-agent', projectScope: 'current_project' });
  const [repositoryForm, setRepositoryForm] = useState({ provider: 'generic_git', name: 'Local repo', repositoryUrl: '', defaultBranch: 'main' });
  const [taskForm, setTaskForm] = useState({ workItemId: '', agentProfileId: '', repositoryConnectionIds: '', instructions: 'Review this work item and prepare an implementation plan.', message: 'Adding context from the frontend console.' });
  const [attemptForm, setAttemptForm] = useState({ attemptType: 'all', status: 'all', retentionDays: '30' });
  const [cliRunForm, setCliRunForm] = useState({ retentionDays: '7' });
  const action = useApiAction(context.addToast);
  const selectedProvider = providers.find((provider) => provider.id === profileForm.providerId);
  const providerStatus = (provider) => provider.enabled === false ? 'deactivated' : 'active';
  const profileStatus = (profile) => profile.status || 'unknown';
  const statusClass = (status) => status === 'active' ? 'status-pill active' : 'status-pill';
  const formatBytes = (value) => {
    const size = Number(value || 0);
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  const credentialTypeOptions = () => {
    if (selectedProvider?.providerType === 'codex') {
      return ['codex_api_key', 'codex_cli_token', 'worker_token'];
    }
    if (selectedProvider?.providerType === 'claude_code') {
      return ['anthropic_api_key', 'claude_cli_token', 'worker_token'];
    }
    if (selectedProvider?.providerType === 'generic_worker') {
      return ['worker_token'];
    }
    return ['codex_api_key', 'codex_cli_token', 'anthropic_api_key', 'claude_cli_token', 'worker_token'];
  };
  const knownAgentTasks = [
    ...(context.agentTaskId ? [{ id: context.agentTaskId, name: context.agentTaskId }] : []),
    ...(task?.id ? [{ id: task.id, name: [task.status, task.workItemId].filter(Boolean).join(' - ') }] : []),
    ...dispatchAttempts
      .map((attempt) => attempt.agentTaskId)
      .filter(Boolean)
      .map((agentTaskId) => ({ id: agentTaskId, name: agentTaskId })),
  ].filter((record, index, rows) => rows.findIndex((candidate) => candidate.id === record.id) === index);

  const providerRuntimeConfig = () => ({
    runtime: {
      mode: providerForm.runtimeMode,
      externalExecutionEnabled: providerForm.externalExecutionEnabled === 'true',
      ...(providerForm.hostedApiBaseUrl ? { hostedApi: { baseUrl: providerForm.hostedApiBaseUrl } } : {}),
      ...(providerForm.cliWorkerCommandProfile ? { cliWorker: { commandProfile: providerForm.cliWorkerCommandProfile } } : {}),
    },
  });

  const credentialMetadata = () => ({
    ...(credentialForm.authScheme ? { authScheme: credentialForm.authScheme } : {}),
    ...(credentialForm.environmentVariable ? { environmentVariable: credentialForm.environmentVariable } : {}),
    ...(credentialForm.workerId ? { workerId: credentialForm.workerId } : {}),
  });

  const credentialDefaultsForProvider = (provider) => {
    if (provider?.providerType === 'codex') {
      return { credentialType: 'codex_api_key', authScheme: 'bearer', environmentVariable: 'CODEX_API_KEY' };
    }
    if (provider?.providerType === 'claude_code') {
      return { credentialType: 'anthropic_api_key', authScheme: 'api_key', environmentVariable: 'ANTHROPIC_API_KEY' };
    }
    if (provider?.providerType === 'generic_worker') {
      return { credentialType: 'worker_token', authScheme: 'bearer', environmentVariable: '' };
    }
    return {};
  };

  const selectProvider = (providerId) => {
    const provider = providers.find((candidate) => candidate.id === providerId);
    setProfileForm({ ...profileForm, providerId });
    setCredentialForm((current) => ({ ...current, ...credentialDefaultsForProvider(provider), secret: '' }));
  };

  const applyProviderPreset = (providerType) => {
    if (providerType === 'codex') {
      setProviderForm({
        providerKey: 'codex-local',
        providerType: 'codex',
        displayName: 'Codex Local',
        dispatchMode: 'managed',
        runtimeMode: 'cli_worker',
        externalExecutionEnabled: 'true',
        hostedApiBaseUrl: '',
        cliWorkerCommandProfile: 'codex-local',
      });
      setCredentialForm({
        credentialType: 'codex_api_key',
        secret: '',
        authScheme: 'bearer',
        environmentVariable: 'CODEX_API_KEY',
        workerId: '',
        expiresAt: '',
      });
      return;
    }
    setProviderForm({
      providerKey: 'claude-code-local',
      providerType: 'claude_code',
      displayName: 'Claude Code Local',
      dispatchMode: 'managed',
      runtimeMode: 'cli_worker',
      externalExecutionEnabled: 'true',
      hostedApiBaseUrl: '',
      cliWorkerCommandProfile: 'claude-code-local',
    });
    setCredentialForm({
      credentialType: 'anthropic_api_key',
      secret: '',
      authScheme: 'api_key',
      environmentVariable: 'ANTHROPIC_API_KEY',
      workerId: '',
      expiresAt: '',
    });
  };

  const providerTypeChanged = (providerType) => {
    if (providerType === 'codex' || providerType === 'claude_code') {
      applyProviderPreset(providerType === 'codex' ? 'codex' : 'claude_code');
      return;
    }
    setProviderForm({ ...providerForm, providerType });
  };

  const attemptQuery = () => ({
    ...(profileForm.providerId ? { providerId: profileForm.providerId } : {}),
    ...(context.agentTaskId ? { agentTaskId: context.agentTaskId } : {}),
    ...(attemptForm.attemptType === 'all' ? {} : { attemptType: attemptForm.attemptType }),
    ...(attemptForm.status === 'all' ? {} : { status: attemptForm.status }),
    limit: 25,
  });

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
      context.services.agents.listDispatchAttempts(context.workspaceId, attemptQuery()),
      context.services.agents.listCliRuns(context.workspaceId),
    ]));
    if (result) {
      const [providerRows, profileRows, repoRows, workItemPage, attemptPage, cliRunRows] = result;
      setProviders(providerRows || []);
      setProfiles(profileRows || []);
      setRepositories(repoRows || []);
      setWorkItems(workItemPage?.items || []);
      setDispatchAttempts(attemptPage?.items || []);
      setCliRuns(cliRunRows || []);
      if (!profileForm.providerId && firstId(providerRows)) {
        const provider = providerRows.find((candidate) => candidate.id === firstId(providerRows));
        setProfileForm((current) => ({ ...current, providerId: firstId(providerRows) }));
        setCredentialForm((current) => ({ ...current, ...credentialDefaultsForProvider(provider), secret: '' }));
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
      providerKey: providerForm.providerKey,
      providerType: providerForm.providerType,
      displayName: providerForm.displayName,
      dispatchMode: providerForm.dispatchMode,
      config: providerRuntimeConfig(),
      enabled: true,
    }), 'Provider created');
    if (provider) {
      setProfileForm({ ...profileForm, providerId: provider.id || profileForm.providerId });
      await load();
    }
  };

  const deactivateProvider = async () => {
    if (!profileForm.providerId) {
      action.setError('Provider is required');
      return;
    }
    await action.run(() => context.services.agents.deactivateProvider(profileForm.providerId), 'Provider deactivated');
    await load();
  };

  const loadCredentials = async () => {
    if (!profileForm.providerId) {
      action.setError('Provider is required');
      return;
    }
    const rows = await action.run(() => context.services.agents.listCredentials(profileForm.providerId));
    if (rows) {
      setCredentials(rows || []);
    }
  };

  const createCredential = async (event) => {
    event.preventDefault();
    if (!profileForm.providerId) {
      action.setError('Provider is required');
      return;
    }
    const credential = await action.run(() => context.services.agents.createCredential(profileForm.providerId, {
      credentialType: credentialForm.credentialType,
      secret: credentialForm.secret,
      metadata: credentialMetadata(),
      expiresAt: credentialForm.expiresAt ? new Date(credentialForm.expiresAt).toISOString() : undefined,
    }), 'Credential saved');
    if (credential) {
      setCredentialForm({ ...credentialForm, secret: '' });
      await loadCredentials();
    }
  };

  const deactivateCredential = async (credentialId) => {
    if (!profileForm.providerId) {
      action.setError('Provider is required');
      return;
    }
    await action.run(() => context.services.agents.deactivateCredential(profileForm.providerId, credentialId), 'Credential deactivated');
    await loadCredentials();
  };

  const reencryptCredentials = async () => {
    if (!profileForm.providerId) {
      action.setError('Provider is required');
      return;
    }
    const rows = await action.run(() => context.services.agents.reencryptCredentials(profileForm.providerId), 'Credentials re-encrypted');
    if (rows) {
      setCredentials(rows || []);
    }
  };

  const rotateCallbackKey = async () => {
    if (!profileForm.providerId) {
      action.setError('Provider is required');
      return;
    }
    const provider = await action.run(() => context.services.agents.rotateCallbackKey(profileForm.providerId), 'Callback key rotated');
    if (provider) {
      await load();
    }
  };

  const createProfile = async (event) => {
    event.preventDefault();
    const profile = await action.run(() => context.services.agents.createProfile(context.workspaceId, {
      providerId: profileForm.providerId,
      displayName: profileForm.displayName,
      username: profileForm.username,
      projectIds: profileForm.projectScope === 'current_project' && context.projectId ? [context.projectId] : [],
      status: 'active',
    }), 'Agent profile created');
    if (profile) {
      setTaskForm({ ...taskForm, agentProfileId: profile.id || taskForm.agentProfileId });
      await load();
    }
  };

  const deactivateProfile = async () => {
    if (!taskForm.agentProfileId) {
      action.setError('Agent profile is required');
      return;
    }
    await action.run(() => context.services.agents.deactivateProfile(taskForm.agentProfileId), 'Agent profile deactivated');
    await load();
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
      setDispatchAttempts(loaded.dispatchAttempts || []);
    }
  };

  const taskCommand = async (command, success) => {
    await action.run(() => command(context.agentTaskId), success);
    await loadTask();
  };

  const previewRuntime = async () => {
    if (!profileForm.providerId) {
      action.setError('Provider is required');
      return;
    }
    const preview = await action.run(() => context.services.agents.previewRuntime(profileForm.providerId, {
      agentProfileId: taskForm.agentProfileId || undefined,
      workItemId: taskForm.workItemId || undefined,
      action: 'dispatched',
    }));
    if (preview) {
      setRuntimePreview(preview);
    }
  };

  const loadDispatchAttempts = async () => {
    const page = await action.run(() => context.services.agents.listDispatchAttempts(context.workspaceId, attemptQuery()));
    if (page) {
      setDispatchAttempts(page.items || []);
    }
  };

  const exportDispatchAttempts = async () => {
    const exportJob = await action.run(() => context.services.agents.exportDispatchAttempts(context.workspaceId, {
      ...(profileForm.providerId ? { providerId: profileForm.providerId } : {}),
      ...(context.agentTaskId ? { agentTaskId: context.agentTaskId } : {}),
      ...(attemptForm.attemptType === 'all' ? {} : { attemptType: attemptForm.attemptType }),
      ...(attemptForm.status === 'all' ? {} : { status: attemptForm.status }),
      limit: 1000,
    }), 'Dispatch attempts exported');
    if (exportJob) {
      setRuntimePreview(exportJob);
    }
  };

  const pruneDispatchAttempts = async () => {
    const result = await action.run(() => context.services.agents.pruneDispatchAttempts(context.workspaceId, {
      ...(profileForm.providerId ? { providerId: profileForm.providerId } : {}),
      ...(attemptForm.attemptType === 'all' ? {} : { attemptType: attemptForm.attemptType }),
      ...(attemptForm.status === 'all' ? {} : { status: attemptForm.status }),
      retentionDays: Number(attemptForm.retentionDays || 30),
      exportBeforePrune: true,
    }), 'Dispatch attempts pruned');
    if (result) {
      setRuntimePreview(result);
      setDispatchAttempts(result.attempts || []);
    }
  };

  const loadCliRuns = async () => {
    const rows = await action.run(() => context.services.agents.listCliRuns(context.workspaceId));
    if (rows) {
      setCliRuns(rows || []);
    }
  };

  const downloadCliRun = async (run) => {
    const blob = await action.run(() => context.services.agents.downloadCliRun(context.workspaceId, run.agentTaskId), 'CLI run archive downloaded');
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `agent-cli-run-${run.agentTaskId}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };

  const deleteCliRun = async (run) => {
    const result = await action.run(() => context.services.agents.deleteCliRun(context.workspaceId, run.agentTaskId), 'CLI run deleted');
    if (result) {
      setRuntimePreview(result);
      await loadCliRuns();
    }
  };

  const pruneCliRuns = async () => {
    const result = await action.run(() => context.services.agents.pruneCliRuns(context.workspaceId, {
      retentionDays: Number(cliRunForm.retentionDays || 7),
    }), 'CLI runs pruned');
    if (result) {
      setRuntimePreview(result);
      await loadCliRuns();
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Provider" icon={<FiCpu />}>
        <form className="stack" onSubmit={createProvider}>
          <div className="button-row wrap">
            <button className="secondary-button" disabled={action.pending} onClick={() => applyProviderPreset('codex')} type="button">Codex preset</button>
            <button className="secondary-button" disabled={action.pending} onClick={() => applyProviderPreset('claude_code')} type="button">Claude preset</button>
          </div>
          <TextField label="Key" value={providerForm.providerKey} onChange={(providerKey) => setProviderForm({ ...providerForm, providerKey })} />
          <SelectField label="Type" value={providerForm.providerType} onChange={providerTypeChanged} options={['simulated', 'codex', 'claude_code', 'generic_worker']} />
          <TextField label="Display name" value={providerForm.displayName} onChange={(displayName) => setProviderForm({ ...providerForm, displayName })} />
          <SelectField label="Dispatch" value={providerForm.dispatchMode} onChange={(dispatchMode) => setProviderForm({ ...providerForm, dispatchMode })} options={['managed', 'manual', 'polling', 'webhook_push']} />
          <SelectField label="Runtime" value={providerForm.runtimeMode} onChange={(runtimeMode) => setProviderForm({ ...providerForm, runtimeMode })} options={['stub', 'hosted_api', 'cli_worker']} />
          <SelectField label="External execution" value={providerForm.externalExecutionEnabled} onChange={(externalExecutionEnabled) => setProviderForm({ ...providerForm, externalExecutionEnabled })} options={['false', 'true']} />
          <TextField label="Hosted API URL" value={providerForm.hostedApiBaseUrl} onChange={(hostedApiBaseUrl) => setProviderForm({ ...providerForm, hostedApiBaseUrl })} />
          <TextField label="CLI profile" value={providerForm.cliWorkerCommandProfile} onChange={(cliWorkerCommandProfile) => setProviderForm({ ...providerForm, cliWorkerCommandProfile })} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create provider</button>
          <button className="secondary-button danger" disabled={action.pending || !profileForm.providerId} onClick={deactivateProvider} type="button"><FiX />Deactivate provider</button>
        </form>
      </Panel>
      <Panel title="Credentials" icon={<FiKey />}>
        <form className="stack" onSubmit={createCredential}>
          <RecordSelect label="Provider" records={providers} value={profileForm.providerId} onChange={selectProvider} />
          <SelectField label="Type" value={credentialForm.credentialType} onChange={(credentialType) => setCredentialForm({ ...credentialForm, credentialType })} options={credentialTypeOptions()} />
          <TextField label="Secret" type="password" value={credentialForm.secret} onChange={(secret) => setCredentialForm({ ...credentialForm, secret })} />
          <SelectField label="Auth scheme" value={credentialForm.authScheme} onChange={(authScheme) => setCredentialForm({ ...credentialForm, authScheme })} options={['bearer', 'api_key', 'cli_token']} />
          <TextField label="Env variable" value={credentialForm.environmentVariable} onChange={(environmentVariable) => setCredentialForm({ ...credentialForm, environmentVariable })} />
          <TextField label="Worker ID" value={credentialForm.workerId} onChange={(workerId) => setCredentialForm({ ...credentialForm, workerId })} />
          <TextField label="Expires at" type="datetime-local" value={credentialForm.expiresAt} onChange={(expiresAt) => setCredentialForm({ ...credentialForm, expiresAt })} />
          <button className="primary-button" disabled={action.pending || !profileForm.providerId || !credentialForm.secret} type="submit"><FiPlus />Save credential</button>
        </form>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending || !profileForm.providerId} onClick={loadCredentials} type="button"><FiRefreshCw />Load credentials</button>
          <button className="secondary-button" disabled={action.pending || !profileForm.providerId} onClick={reencryptCredentials} type="button">Re-encrypt</button>
          <button className="secondary-button" disabled={action.pending || !profileForm.providerId} onClick={rotateCallbackKey} type="button">Rotate callback key</button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Active</th>
                <th>Expires</th>
                <th>Provider</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((credential) => (
                <tr key={credential.id}>
                  <td>{credential.credentialType}</td>
                  <td><span className={credential.active ? 'status-pill active' : 'status-pill'}>{credential.active ? 'active' : 'inactive'}</span></td>
                  <td>{credential.expiresAt ? new Date(credential.expiresAt).toLocaleString() : ''}</td>
                  <td>{selectedProvider?.providerKey || credential.providerId}</td>
                  <td><button className="icon-button danger" disabled={action.pending || !credential.active} onClick={() => deactivateCredential(credential.id)} title="Deactivate" type="button"><FiX /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Profile" icon={<FiUsers />}>
        <form className="stack" onSubmit={createProfile}>
          <RecordSelect label="Provider" records={providers} value={profileForm.providerId} onChange={selectProvider} />
          <TextField label="Display name" value={profileForm.displayName} onChange={(displayName) => setProfileForm({ ...profileForm, displayName })} />
          <TextField label="Username" value={profileForm.username} onChange={(username) => setProfileForm({ ...profileForm, username })} />
          <SelectField label="Project access" value={profileForm.projectScope} onChange={(projectScope) => setProfileForm({ ...profileForm, projectScope })} options={['current_project', 'workspace']} />
          <button className="primary-button" disabled={action.pending || !profileForm.providerId} type="submit"><FiPlus />Create profile</button>
          <button className="secondary-button" disabled={action.pending || !profileForm.providerId} onClick={previewRuntime} type="button"><FiEye />Preview runtime</button>
          <button className="secondary-button danger" disabled={action.pending || !taskForm.agentProfileId} onClick={deactivateProfile} type="button"><FiX />Deactivate profile</button>
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
          <RecordSelect label="Agent task" records={knownAgentTasks} value={context.agentTaskId} onChange={context.setAgentTaskId} includeBlank />
          <TextField label="Message" value={taskForm.message} onChange={(message) => setTaskForm({ ...taskForm, message })} />
          <button className="secondary-button" disabled={action.pending || !context.agentTaskId} onClick={loadTask} type="button"><FiRefreshCw />Load</button>
          <button className="secondary-button" disabled={action.pending || !context.agentTaskId} onClick={() => taskCommand(context.services.agents.retry, 'Retry requested')} type="button">Retry</button>
          <button className="secondary-button" disabled={action.pending || !context.agentTaskId} onClick={() => taskCommand(context.services.agents.acceptResult, 'Result accepted')} type="button">Accept</button>
          <button className="icon-button danger" disabled={action.pending || !context.agentTaskId} onClick={() => taskCommand(context.services.agents.cancel, 'Task canceled')} title="Cancel" type="button"><FiX /></button>
        </div>
        <ErrorLine message={action.error} />
      </Panel>
      <Panel title="Agent Records" icon={<FiEye />} wide>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          <SelectField label="Attempt" value={attemptForm.attemptType} onChange={(attemptType) => setAttemptForm({ ...attemptForm, attemptType })} options={['all', 'dispatch', 'retry', 'cancel']} />
          <SelectField label="Status" value={attemptForm.status} onChange={(status) => setAttemptForm({ ...attemptForm, status })} options={['all', 'succeeded', 'failed']} />
          <TextField label="Retention days" type="number" value={attemptForm.retentionDays} onChange={(retentionDays) => setAttemptForm({ ...attemptForm, retentionDays })} />
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadDispatchAttempts} type="button">Attempts</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={exportDispatchAttempts} type="button">Export attempts</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={pruneDispatchAttempts} type="button">Prune attempts</button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Type</th>
                <th>Dispatch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((provider) => {
                const status = providerStatus(provider);
                return (
                  <tr key={provider.id}>
                    <td>{provider.displayName || provider.providerKey}</td>
                    <td>{provider.providerType}</td>
                    <td>{provider.dispatchMode}</td>
                    <td><span className={statusClass(status)}>{status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Max tasks</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
                const status = profileStatus(profile);
                return (
                  <tr key={profile.id}>
                    <td>{profile.displayName}</td>
                    <td>{profile.providerId}</td>
                    <td><span className={statusClass(status)}>{status}</span></td>
                    <td>{profile.maxConcurrentTasks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Provider</th>
                <th>Transport</th>
                <th>External</th>
                <th>Started</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {dispatchAttempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.attemptType}</td>
                  <td><span className={attempt.status === 'succeeded' ? 'status-pill active' : 'status-pill'}>{attempt.status}</span></td>
                  <td>{attempt.providerType}</td>
                  <td>{attempt.transport}</td>
                  <td>{attempt.externalDispatch ? 'true' : 'false'}</td>
                  <td>{attempt.startedAt ? new Date(attempt.startedAt).toLocaleString() : ''}</td>
                  <td className="truncate-cell">{attempt.errorMessage || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="data-columns">
          <JsonPreview title="Providers" value={providers} />
          <JsonPreview title="Profiles" value={profiles} />
          <JsonPreview title="Repositories" value={repositories} />
          <JsonPreview title="Work Items" value={workItems} />
          <JsonPreview title="Task" value={task} />
          <JsonPreview title="Runtime Preview" value={runtimePreview} />
          <JsonPreview title="Dispatch Attempts" value={dispatchAttempts} />
        </div>
      </Panel>
      <Panel title="CLI Run Artifacts" icon={<FiArchive />} wide>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadCliRuns} type="button"><FiRefreshCw />Load runs</button>
          <TextField label="Retention days" type="number" value={cliRunForm.retentionDays} onChange={(retentionDays) => setCliRunForm({ ...cliRunForm, retentionDays })} />
          <button className="secondary-button danger" disabled={action.pending || !context.workspaceId} onClick={pruneCliRuns} type="button"><FiTrash2 />Prune runs</button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Files</th>
                <th>Size</th>
                <th>Updated</th>
                <th>Artifacts</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cliRuns.map((run) => (
                <tr key={run.agentTaskId}>
                  <td className="truncate-cell">{run.agentTaskId}</td>
                  <td>{run.providerType || run.providerId}</td>
                  <td><span className={run.status === 'completed' || run.status === 'review_requested' ? 'status-pill active' : 'status-pill'}>{run.status}</span></td>
                  <td>{run.fileCount}</td>
                  <td>{formatBytes(run.sizeBytes)}</td>
                  <td>{run.updatedAt ? new Date(run.updatedAt).toLocaleString() : ''}</td>
                  <td>{[
                    run.promptPresent ? 'prompt' : null,
                    run.taskFilePresent ? 'task' : null,
                    run.outputPresent ? 'output' : null,
                  ].filter(Boolean).join(', ')}</td>
                  <td>
                    <div className="button-row compact">
                      <button className="icon-button" disabled={action.pending} onClick={() => downloadCliRun(run)} title="Download archive" type="button"><FiDownload /></button>
                      <button className="icon-button danger" disabled={action.pending} onClick={() => deleteCliRun(run)} title="Delete run directory" type="button"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <JsonPreview title="CLI Runs" value={cliRuns} />
      </Panel>
    </div>
  );
};
