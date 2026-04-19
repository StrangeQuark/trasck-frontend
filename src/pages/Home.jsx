import { useMemo, useState } from 'react';
import {
  FiActivity,
  FiArrowRight,
  FiCheck,
  FiCpu,
  FiDatabase,
  FiEye,
  FiLayers,
  FiList,
  FiLogIn,
  FiLogOut,
  FiRefreshCw,
  FiSend,
  FiSettings,
  FiUser,
} from 'react-icons/fi';
import { DEFAULT_API_BASE_URL, createTrasckApiClient, normalizeBaseUrl } from '../api/client';
import { createAgentsService } from '../api/services/agentsService';
import { createAuthService } from '../api/services/authService';
import { createDashboardsService } from '../api/services/dashboardsService';
import { createWorkItemsService } from '../api/services/workItemsService';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { useLocalStorage } from '../hooks/useLocalStorage';
import './css/Home.css';

const defaultSetupForm = {
  email: 'admin@trasck.local',
  username: 'admin',
  displayName: 'Trasck Admin',
  password: 'trasck-password',
  organizationName: 'Trasck Local',
  organizationSlug: 'trasck-local',
  workspaceName: 'Trasck Workspace',
  workspaceKey: 'TRASCK',
  projectName: 'Trasck Project',
  projectKey: 'TRASCK',
};

const defaultWorkQuery = {
  customFieldKey: '',
  customFieldOperator: 'eq',
  customFieldValue: '',
  customFieldValueTo: '',
};

const Home = () => {
  const [apiBaseUrl, setApiBaseUrl] = useLocalStorage('trasck.apiBaseUrl', DEFAULT_API_BASE_URL);
  const [accessToken, setAccessToken] = useLocalStorage('trasck.accessToken', '');
  const [workspaceId, setWorkspaceId] = useLocalStorage('trasck.workspaceId', '');
  const [projectId, setProjectId] = useLocalStorage('trasck.projectId', '');
  const [dashboardId, setDashboardId] = useLocalStorage('trasck.dashboardId', '');
  const [agentTaskId, setAgentTaskId] = useLocalStorage('trasck.agentTaskId', '');

  const [setupForm, setSetupForm] = useState(defaultSetupForm);
  const [loginForm, setLoginForm] = useState({ identifier: defaultSetupForm.email, password: defaultSetupForm.password });
  const [currentUser, setCurrentUser] = useState(null);
  const [setupResult, setSetupResult] = useState(null);

  const [workQuery, setWorkQuery] = useState(defaultWorkQuery);
  const [workItems, setWorkItems] = useState([]);
  const [nextCursor, setNextCursor] = useState('');
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const [newWorkItem, setNewWorkItem] = useState({ typeKey: 'story', title: 'New work item' });

  const [dashboardQuery, setDashboardQuery] = useState({ from: '', to: '' });
  const [dashboardRender, setDashboardRender] = useState(null);

  const [agentForm, setAgentForm] = useState({
    workItemId: '',
    agentProfileId: '',
    repositoryConnectionIds: '',
    instructions: 'Review this work item and prepare an implementation plan.',
    message: 'Adding context from the frontend console.',
  });
  const [agentTask, setAgentTask] = useState(null);

  const setupAction = useAsyncAction();
  const loginAction = useAsyncAction();
  const workAction = useAsyncAction();
  const dashboardAction = useAsyncAction();
  const agentAction = useAsyncAction();

  const api = useMemo(() => createTrasckApiClient({
    baseUrl: apiBaseUrl,
    accessToken,
  }), [apiBaseUrl, accessToken]);

  const services = useMemo(() => ({
    auth: createAuthService(api),
    workItems: createWorkItemsService(api),
    dashboards: createDashboardsService(api),
    agents: createAgentsService(api),
  }), [api]);

  const authenticated = Boolean(accessToken);

  const saveConnection = (event) => {
    event.preventDefault();
    setApiBaseUrl(normalizeBaseUrl(apiBaseUrl));
  };

  const submitSetup = async (event) => {
    event.preventDefault();
    const result = await setupAction.run(async () => {
      const setup = await services.auth.setup({
        adminUser: {
          email: setupForm.email,
          username: setupForm.username,
          displayName: setupForm.displayName,
          password: setupForm.password,
        },
        organization: {
          name: setupForm.organizationName,
          slug: setupForm.organizationSlug,
        },
        workspace: {
          name: setupForm.workspaceName,
          key: setupForm.workspaceKey,
          anonymousReadEnabled: false,
        },
        project: {
          name: setupForm.projectName,
          key: setupForm.projectKey,
          visibility: 'private',
        },
      });
      setSetupResult(setup);
      setWorkspaceId(setup?.workspace?.id || '');
      setProjectId(setup?.project?.id || '');
      const session = await services.auth.login({
        identifier: setupForm.email,
        password: setupForm.password,
      });
      setAccessToken(session?.accessToken || '');
      setCurrentUser(session?.user || null);
      setLoginForm({ identifier: setupForm.email, password: setupForm.password });
      return setup;
    });

    if (result?.project?.id) {
      setWorkItems([]);
      setSelectedWorkItem(null);
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    const session = await loginAction.run(() => services.auth.login(loginForm));
    if (session?.accessToken) {
      setAccessToken(session.accessToken);
      setCurrentUser(session.user || null);
    }
  };

  const loadCurrentUser = async () => {
    const user = await loginAction.run(() => services.auth.me());
    if (user) {
      setCurrentUser(user);
    }
  };

  const logout = async () => {
    await loginAction.run(async () => {
      if (authenticated) {
        await services.auth.logout();
      }
      setAccessToken('');
      setCurrentUser(null);
      setWorkItems([]);
      setSelectedWorkItem(null);
      setDashboardRender(null);
      setAgentTask(null);
    });
  };

  const workItemQueryParams = (cursor) => {
    const query = { limit: 25 };
    if (cursor) {
      query.cursor = cursor;
    }
    if (workQuery.customFieldKey.trim() && workQuery.customFieldValue.trim()) {
      query.customFieldKey = workQuery.customFieldKey.trim();
      query.customFieldOperator = workQuery.customFieldOperator;
      query.customFieldValue = workQuery.customFieldValue.trim();
      if (workQuery.customFieldOperator === 'between' && workQuery.customFieldValueTo.trim()) {
        query.customFieldValueTo = workQuery.customFieldValueTo.trim();
      }
    }
    return query;
  };

  const loadWorkItems = async (projectOverride = projectId, cursor = '') => {
    if (!projectOverride) {
      workAction.setError('Project ID is required');
      return;
    }
    const page = await workAction.run(() => services.workItems.listByProject(projectOverride, workItemQueryParams(cursor)));
    if (page) {
      const items = Array.isArray(page.items) ? page.items : [];
      setWorkItems(cursor ? [...workItems, ...items] : items);
      setNextCursor(page.nextCursor || '');
    }
  };

  const createWorkItem = async (event) => {
    event.preventDefault();
    if (!projectId) {
      workAction.setError('Project ID is required');
      return;
    }
    const created = await workAction.run(() => services.workItems.create(projectId, {
      typeKey: newWorkItem.typeKey,
      title: newWorkItem.title,
    }));
    if (created?.id) {
      setSelectedWorkItem(created);
      await loadWorkItems(projectId);
    }
  };

  const openWorkItem = async (workItemId) => {
    const item = await workAction.run(() => services.workItems.get(workItemId));
    if (item) {
      setSelectedWorkItem(item);
      setAgentForm((current) => ({ ...current, workItemId: item.id || '' }));
    }
  };

  const renderDashboard = async (event) => {
    event.preventDefault();
    if (!dashboardId) {
      dashboardAction.setError('Dashboard ID is required');
      return;
    }
    const query = {};
    if (dashboardQuery.from) {
      query.from = dashboardQuery.from;
    }
    if (dashboardQuery.to) {
      query.to = dashboardQuery.to;
    }
    const rendered = await dashboardAction.run(() => services.dashboards.render(dashboardId, query));
    if (rendered) {
      setDashboardRender(rendered);
    }
  };

  const assignAgent = async (event) => {
    event.preventDefault();
    if (!agentForm.workItemId || !agentForm.agentProfileId) {
      agentAction.setError('Work item ID and agent profile ID are required');
      return;
    }
    const repositoryConnectionIds = agentForm.repositoryConnectionIds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const task = await agentAction.run(() => services.agents.assign(agentForm.workItemId, {
      agentProfileId: agentForm.agentProfileId,
      repositoryConnectionIds,
      requestPayload: { instructions: agentForm.instructions },
    }));
    if (task) {
      setAgentTask(task);
      setAgentTaskId(task.id || '');
    }
  };

  const loadAgentTask = async (taskId = agentTaskId) => {
    if (!taskId) {
      agentAction.setError('Agent task ID is required');
      return;
    }
    const task = await agentAction.run(() => services.agents.getTask(taskId));
    if (task) {
      setAgentTask(task);
      setAgentTaskId(task.id || taskId);
    }
  };

  const sendAgentMessage = async () => {
    if (!agentTaskId || !agentForm.message.trim()) {
      agentAction.setError('Agent task ID and message are required');
      return;
    }
    await agentAction.run(() => services.agents.addMessage(agentTaskId, { bodyMarkdown: agentForm.message.trim() }));
    await loadAgentTask(agentTaskId);
  };

  const requestAgentChanges = async () => {
    if (!agentTaskId || !agentForm.message.trim()) {
      agentAction.setError('Agent task ID and message are required');
      return;
    }
    await agentAction.run(() => services.agents.requestChanges(agentTaskId, {
      message: agentForm.message.trim(),
      requestPayload: { instructions: agentForm.instructions },
    }));
    await loadAgentTask(agentTaskId);
  };

  const runAgentCommand = async (command) => {
    if (!agentTaskId) {
      agentAction.setError('Agent task ID is required');
      return;
    }
    await agentAction.run(() => command(agentTaskId));
    await loadAgentTask(agentTaskId);
  };

  return (
    <main className="home">
      <header className="app-header">
        <div>
          <span className="app-kicker">Trasck</span>
          <h1>Project Console</h1>
        </div>
        <StatusPill active={authenticated} />
      </header>

      <section className="console-grid">
        <Panel title="Connection" icon={<FiSettings />}>
          <form className="stack" onSubmit={saveConnection}>
            <Field label="Backend URL">
              <input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
            </Field>
            <button className="primary-button" type="submit">
              <FiCheck />
              Save
            </button>
          </form>
        </Panel>

        <Panel title="Setup" icon={<FiDatabase />}>
          <form className="stack" onSubmit={submitSetup}>
            <div className="two-column">
              <Field label="Admin email">
                <input value={setupForm.email} onChange={(event) => setSetupForm({ ...setupForm, email: event.target.value })} />
              </Field>
              <Field label="Username">
                <input value={setupForm.username} onChange={(event) => setSetupForm({ ...setupForm, username: event.target.value })} />
              </Field>
              <Field label="Display name">
                <input value={setupForm.displayName} onChange={(event) => setSetupForm({ ...setupForm, displayName: event.target.value })} />
              </Field>
              <Field label="Password">
                <input type="password" value={setupForm.password} onChange={(event) => setSetupForm({ ...setupForm, password: event.target.value })} />
              </Field>
              <Field label="Organization">
                <input value={setupForm.organizationName} onChange={(event) => setSetupForm({ ...setupForm, organizationName: event.target.value })} />
              </Field>
              <Field label="Slug">
                <input value={setupForm.organizationSlug} onChange={(event) => setSetupForm({ ...setupForm, organizationSlug: event.target.value })} />
              </Field>
              <Field label="Workspace">
                <input value={setupForm.workspaceName} onChange={(event) => setSetupForm({ ...setupForm, workspaceName: event.target.value })} />
              </Field>
              <Field label="Workspace key">
                <input value={setupForm.workspaceKey} onChange={(event) => setSetupForm({ ...setupForm, workspaceKey: event.target.value.toUpperCase() })} />
              </Field>
              <Field label="Project">
                <input value={setupForm.projectName} onChange={(event) => setSetupForm({ ...setupForm, projectName: event.target.value })} />
              </Field>
              <Field label="Project key">
                <input value={setupForm.projectKey} onChange={(event) => setSetupForm({ ...setupForm, projectKey: event.target.value.toUpperCase() })} />
              </Field>
            </div>
            <button className="primary-button" disabled={setupAction.pending} type="submit">
              <FiArrowRight />
              Create
            </button>
            <ErrorLine message={setupAction.error} />
          </form>
        </Panel>

        <Panel title="Auth" icon={<FiUser />}>
          <form className="stack" onSubmit={submitLogin}>
            <Field label="Identifier">
              <input value={loginForm.identifier} onChange={(event) => setLoginForm({ ...loginForm, identifier: event.target.value })} />
            </Field>
            <Field label="Password">
              <input type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} />
            </Field>
            <div className="button-row">
              <button className="primary-button" disabled={loginAction.pending} type="submit">
                <FiLogIn />
                Login
              </button>
              <button className="icon-button" disabled={loginAction.pending || !authenticated} onClick={loadCurrentUser} type="button" title="Refresh current user">
                <FiRefreshCw />
              </button>
              <button className="icon-button danger" disabled={loginAction.pending || !authenticated} onClick={logout} type="button" title="Logout">
                <FiLogOut />
              </button>
            </div>
            <ErrorLine message={loginAction.error} />
          </form>
          <SummaryRows rows={[
            ['User', currentUser?.displayName || currentUser?.username || ''],
            ['Workspace', workspaceId],
            ['Project', projectId],
          ]} />
        </Panel>

        <Panel title="Project Work" icon={<FiList />} wide>
          <div className="work-layout">
            <form className="stack" onSubmit={(event) => { event.preventDefault(); loadWorkItems(projectId); }}>
              <Field label="Project ID">
                <input value={projectId} onChange={(event) => setProjectId(event.target.value)} />
              </Field>
              <div className="two-column compact">
                <Field label="Custom field">
                  <input value={workQuery.customFieldKey} onChange={(event) => setWorkQuery({ ...workQuery, customFieldKey: event.target.value })} />
                </Field>
                <Field label="Operator">
                  <select value={workQuery.customFieldOperator} onChange={(event) => setWorkQuery({ ...workQuery, customFieldOperator: event.target.value })}>
                    {['eq', 'ne', 'contains', 'not_contains', 'in', 'gt', 'gte', 'lt', 'lte', 'between'].map((operator) => (
                      <option key={operator} value={operator}>{operator}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Value">
                  <input value={workQuery.customFieldValue} onChange={(event) => setWorkQuery({ ...workQuery, customFieldValue: event.target.value })} />
                </Field>
                <Field label="Value to">
                  <input value={workQuery.customFieldValueTo} onChange={(event) => setWorkQuery({ ...workQuery, customFieldValueTo: event.target.value })} />
                </Field>
              </div>
              <div className="button-row">
                <button className="primary-button" disabled={workAction.pending} type="submit">
                  <FiRefreshCw />
                  Load
                </button>
                <button className="secondary-button" disabled={!nextCursor || workAction.pending} onClick={() => loadWorkItems(projectId, nextCursor)} type="button">
                  More
                </button>
              </div>
            </form>

            <form className="stack create-strip" onSubmit={createWorkItem}>
              <Field label="Type key">
                <input value={newWorkItem.typeKey} onChange={(event) => setNewWorkItem({ ...newWorkItem, typeKey: event.target.value })} />
              </Field>
              <Field label="Title">
                <input value={newWorkItem.title} onChange={(event) => setNewWorkItem({ ...newWorkItem, title: event.target.value })} />
              </Field>
              <button className="secondary-button" disabled={workAction.pending} type="submit">
                <FiArrowRight />
                Create
              </button>
            </form>

            <ErrorLine message={workAction.error} />
            <div className="work-columns">
              <div className="work-list">
                {workItems.length === 0 ? (
                  <EmptyState label="No work items loaded" />
                ) : workItems.map((item) => (
                  <button className="work-row" key={item.id} onClick={() => openWorkItem(item.id)} type="button">
                    <span className="work-key">{item.key || item.id}</span>
                    <span className="work-title">{item.title}</span>
                    <FiEye />
                  </button>
                ))}
              </div>
              <JsonPreview title="Detail" value={selectedWorkItem} />
            </div>
          </div>
        </Panel>

        <Panel title="Dashboard" icon={<FiActivity />}>
          <form className="stack" onSubmit={renderDashboard}>
            <Field label="Dashboard ID">
              <input value={dashboardId} onChange={(event) => setDashboardId(event.target.value)} />
            </Field>
            <div className="two-column compact">
              <Field label="From">
                <input value={dashboardQuery.from} onChange={(event) => setDashboardQuery({ ...dashboardQuery, from: event.target.value })} placeholder="2026-04-01T00:00:00Z" />
              </Field>
              <Field label="To">
                <input value={dashboardQuery.to} onChange={(event) => setDashboardQuery({ ...dashboardQuery, to: event.target.value })} placeholder="2026-04-30T00:00:00Z" />
              </Field>
            </div>
            <button className="primary-button" disabled={dashboardAction.pending} type="submit">
              <FiRefreshCw />
              Render
            </button>
            <ErrorLine message={dashboardAction.error} />
          </form>
          <JsonPreview title="Render" value={dashboardRender} />
        </Panel>

        <Panel title="Agent Task" icon={<FiCpu />} wide>
          <div className="agent-layout">
            <form className="stack" onSubmit={assignAgent}>
              <div className="two-column compact">
                <Field label="Work item ID">
                  <input value={agentForm.workItemId} onChange={(event) => setAgentForm({ ...agentForm, workItemId: event.target.value })} />
                </Field>
                <Field label="Agent profile ID">
                  <input value={agentForm.agentProfileId} onChange={(event) => setAgentForm({ ...agentForm, agentProfileId: event.target.value })} />
                </Field>
              </div>
              <Field label="Repository IDs">
                <input value={agentForm.repositoryConnectionIds} onChange={(event) => setAgentForm({ ...agentForm, repositoryConnectionIds: event.target.value })} />
              </Field>
              <Field label="Instructions">
                <textarea value={agentForm.instructions} onChange={(event) => setAgentForm({ ...agentForm, instructions: event.target.value })} rows={4} />
              </Field>
              <button className="primary-button" disabled={agentAction.pending} type="submit">
                <FiSend />
                Assign
              </button>
            </form>

            <div className="stack">
              <Field label="Agent task ID">
                <input value={agentTaskId} onChange={(event) => setAgentTaskId(event.target.value)} />
              </Field>
              <Field label="Message">
                <textarea value={agentForm.message} onChange={(event) => setAgentForm({ ...agentForm, message: event.target.value })} rows={4} />
              </Field>
              <div className="button-row wrap">
                <button className="secondary-button" disabled={agentAction.pending} onClick={() => loadAgentTask()} type="button">
                  <FiRefreshCw />
                  Load
                </button>
                <button className="secondary-button" disabled={agentAction.pending} onClick={sendAgentMessage} type="button">
                  Message
                </button>
                <button className="secondary-button" disabled={agentAction.pending} onClick={requestAgentChanges} type="button">
                  Changes
                </button>
                <button className="icon-button" disabled={agentAction.pending} onClick={() => runAgentCommand(services.agents.retry)} type="button" title="Retry">
                  <FiRefreshCw />
                </button>
                <button className="icon-button" disabled={agentAction.pending} onClick={() => runAgentCommand(services.agents.acceptResult)} type="button" title="Accept result">
                  <FiCheck />
                </button>
                <button className="icon-button danger" disabled={agentAction.pending} onClick={() => runAgentCommand(services.agents.cancel)} type="button" title="Cancel">
                  <FiLogOut />
                </button>
              </div>
              <ErrorLine message={agentAction.error} />
            </div>
          </div>
          <JsonPreview title="Task" value={agentTask} />
        </Panel>
      </section>

      {setupResult && (
        <section className="setup-result">
          <FiLayers />
          <span>{setupResult.workspace?.name}</span>
          <span>{setupResult.project?.key}</span>
        </section>
      )}
    </main>
  );
};

const Panel = ({ title, icon, children, wide = false }) => (
  <section className={`panel${wide ? ' panel-wide' : ''}`}>
    <header className="panel-header">
      <span className="panel-icon">{icon}</span>
      <h2>{title}</h2>
    </header>
    {children}
  </section>
);

const Field = ({ label, children }) => (
  <label className="field">
    <span>{label}</span>
    {children}
  </label>
);

const ErrorLine = ({ message }) => (
  message ? <p className="error-line">{message}</p> : null
);

const StatusPill = ({ active }) => (
  <span className={`status-pill${active ? ' active' : ''}`}>
    {active ? 'Authenticated' : 'Signed out'}
  </span>
);

const SummaryRows = ({ rows }) => (
  <dl className="summary-rows">
    {rows.map(([label, value]) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>{value || 'None'}</dd>
      </div>
    ))}
  </dl>
);

const EmptyState = ({ label }) => (
  <div className="empty-state">{label}</div>
);

const JsonPreview = ({ title, value }) => (
  <section className="json-preview">
    <h3>{title}</h3>
    <pre>{value ? JSON.stringify(value, null, 2) : 'None'}</pre>
  </section>
);

export default Home;
