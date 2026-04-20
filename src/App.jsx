import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiCpu,
  FiDatabase,
  FiEye,
  FiFilter,
  FiKey,
  FiLayers,
  FiList,
  FiLogIn,
  FiLogOut,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiSettings,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { DEFAULT_API_BASE_URL, apiErrorMessage, createTrasckApiClient, normalizeBaseUrl } from './api/client';
import { createAgentsService } from './api/services/agentsService';
import { createAuthService } from './api/services/authService';
import { createDashboardsService } from './api/services/dashboardsService';
import { createPlanningService } from './api/services/planningService';
import { createSearchService } from './api/services/searchService';
import { createWorkItemsService } from './api/services/workItemsService';
import { useLocalStorage } from './hooks/useLocalStorage';
import './pages/css/Home.css';

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

const defaultSavedFilterQuery = {
  entityType: 'work_item',
  projectId: '',
  sort: [{ field: 'workspaceSequenceNumber', direction: 'asc' }],
  where: {
    op: 'and',
    conditions: [
      { field: 'title', operator: 'contains', value: 'story' },
    ],
  },
};

const App = () => {
  const [apiBaseUrl, setApiBaseUrl] = useLocalStorage('trasck.apiBaseUrl', DEFAULT_API_BASE_URL);
  const [workspaceId, setWorkspaceId] = useLocalStorage('trasck.workspaceId', '');
  const [projectId, setProjectId] = useLocalStorage('trasck.projectId', '');
  const [dashboardId, setDashboardId] = useLocalStorage('trasck.dashboardId', '');
  const [savedFilterId, setSavedFilterId] = useLocalStorage('trasck.savedFilterId', '');
  const [agentTaskId, setAgentTaskId] = useLocalStorage('trasck.agentTaskId', '');
  const [currentUser, setCurrentUser] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, tone = 'info') => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 5200);
  };

  const api = useMemo(() => createTrasckApiClient({ baseUrl: apiBaseUrl }), [apiBaseUrl]);
  const services = useMemo(() => ({
    agents: createAgentsService(api),
    auth: createAuthService(api),
    dashboards: createDashboardsService(api),
    planning: createPlanningService(api),
    search: createSearchService(api),
    workItems: createWorkItemsService(api),
  }), [api]);

  useEffect(() => {
    services.auth.me()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, [services]);

  const context = {
    addToast,
    apiBaseUrl,
    currentUser,
    dashboardId,
    projectId,
    savedFilterId,
    services,
    setApiBaseUrl,
    setCurrentUser,
    setDashboardId,
    setProjectId,
    setSavedFilterId,
    setWorkspaceId,
    setAgentTaskId,
    workspaceId,
    agentTaskId,
  };

  return (
    <BrowserRouter>
      <main className="app-shell">
        <Shell context={context}>
          <Routes>
            <Route path="/" element={<OverviewPage context={context} />} />
            <Route path="/setup" element={<SetupPage context={context} />} />
            <Route path="/auth" element={<AuthPage context={context} />} />
            <Route path="/work" element={<WorkPage context={context} />} />
            <Route path="/planning" element={<PlanningPage context={context} />} />
            <Route path="/dashboards" element={<DashboardsPage context={context} />} />
            <Route path="/filters" element={<SearchPage context={context} />} />
            <Route path="/agents" element={<AgentsPage context={context} />} />
            <Route path="/tokens" element={<TokenAdminPage context={context} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
        <ToastStack items={toasts} onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))} />
      </main>
    </BrowserRouter>
  );
};

const Shell = ({ children, context }) => {
  const { apiBaseUrl, currentUser, setApiBaseUrl, workspaceId, projectId } = context;
  const [draftBaseUrl, setDraftBaseUrl] = useState(apiBaseUrl);

  useEffect(() => {
    setDraftBaseUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  const saveConnection = (event) => {
    event.preventDefault();
    setApiBaseUrl(normalizeBaseUrl(draftBaseUrl));
    context.addToast('Connection saved', 'success');
  };

  return (
    <>
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">T</span>
          <div>
            <span className="app-kicker">Trasck</span>
            <h1>Project Console</h1>
          </div>
        </div>
        <form className="connection-form" onSubmit={saveConnection}>
          <input aria-label="Backend URL" value={draftBaseUrl} onChange={(event) => setDraftBaseUrl(event.target.value)} />
          <button className="icon-button" title="Save backend URL" type="submit">
            <FiCheck />
          </button>
        </form>
        <StatusPill active={Boolean(currentUser)} label={currentUser?.displayName || currentUser?.username || 'Signed out'} />
      </header>

      <nav className="route-tabs" aria-label="Primary">
        <RouteLink to="/" icon={<FiActivity />} label="Overview" />
        <RouteLink to="/setup" icon={<FiDatabase />} label="Setup" />
        <RouteLink to="/auth" icon={<FiLogIn />} label="Auth" />
        <RouteLink to="/work" icon={<FiList />} label="Work" />
        <RouteLink to="/planning" icon={<FiUsers />} label="Planning" />
        <RouteLink to="/filters" icon={<FiFilter />} label="Filters" />
        <RouteLink to="/dashboards" icon={<FiBarChart2 />} label="Dashboards" />
        <RouteLink to="/agents" icon={<FiCpu />} label="Agents" />
        <RouteLink to="/tokens" icon={<FiKey />} label="Tokens" />
      </nav>

      <section className="context-strip">
        <InlineId label="Workspace" value={workspaceId} onChange={context.setWorkspaceId} />
        <InlineId label="Project" value={projectId} onChange={context.setProjectId} />
      </section>

      <section className="page-frame">
        {children}
      </section>
    </>
  );
};

const OverviewPage = ({ context }) => (
  <div className="content-grid three">
    <Panel title="Session" icon={<FiLogIn />}>
      <SummaryRows rows={[
        ['User', context.currentUser?.displayName || context.currentUser?.username || 'None'],
        ['Workspace', context.workspaceId],
        ['Project', context.projectId],
      ]} />
      <div className="button-row">
        <NavLink className="secondary-button" to="/auth">Auth</NavLink>
        <NavLink className="secondary-button" to="/setup">Setup</NavLink>
      </div>
    </Panel>
    <Panel title="Build" icon={<FiLayers />}>
      <div className="action-grid">
        <NavLink className="action-tile" to="/work"><FiList /> Work items</NavLink>
        <NavLink className="action-tile" to="/planning"><FiUsers /> Teams</NavLink>
        <NavLink className="action-tile" to="/filters"><FiFilter /> Filters</NavLink>
        <NavLink className="action-tile" to="/dashboards"><FiBarChart2 /> Dashboards</NavLink>
      </div>
    </Panel>
    <Panel title="Automation" icon={<FiCpu />}>
      <div className="action-grid">
        <NavLink className="action-tile" to="/agents"><FiCpu /> Agents</NavLink>
        <NavLink className="action-tile" to="/tokens"><FiKey /> API tokens</NavLink>
      </div>
    </Panel>
  </div>
);

const SetupPage = ({ context }) => {
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

const AuthPage = ({ context }) => {
  const [loginForm, setLoginForm] = useState({ identifier: defaultSetupForm.email, password: defaultSetupForm.password });
  const action = useApiAction(context.addToast);

  const login = async (event) => {
    event.preventDefault();
    const session = await action.run(() => context.services.auth.login(loginForm), 'Signed in');
    if (session) {
      context.setCurrentUser(session.user || null);
    }
  };

  const refresh = async () => {
    const user = await action.run(() => context.services.auth.me(), 'Session refreshed');
    if (user) {
      context.setCurrentUser(user);
    }
  };

  const logout = async () => {
    await action.run(() => context.services.auth.logout(), 'Signed out');
    context.setCurrentUser(null);
  };

  return (
    <div className="content-grid">
      <Panel title="Sign In" icon={<FiLogIn />}>
        <form className="stack" onSubmit={login}>
          <TextField label="Identifier" value={loginForm.identifier} onChange={(identifier) => setLoginForm({ ...loginForm, identifier })} />
          <TextField label="Password" type="password" value={loginForm.password} onChange={(password) => setLoginForm({ ...loginForm, password })} />
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending} type="submit">
              <FiLogIn />
              Login
            </button>
            <button className="secondary-button" disabled={action.pending} onClick={refresh} type="button">
              <FiRefreshCw />
              Refresh
            </button>
            <button className="icon-button danger" disabled={action.pending} onClick={logout} title="Logout" type="button">
              <FiLogOut />
            </button>
          </div>
          <ErrorLine message={action.error} />
        </form>
      </Panel>
      <Panel title="Current User" icon={<FiEye />}>
        <JsonPreview value={context.currentUser} />
      </Panel>
    </div>
  );
};

const WorkPage = ({ context }) => {
  const [workQuery, setWorkQuery] = useState({ customFieldKey: '', customFieldOperator: 'eq', customFieldValue: '', customFieldValueTo: '' });
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState('');
  const [selected, setSelected] = useState(null);
  const [newWorkItem, setNewWorkItem] = useState({ typeKey: 'story', title: 'New work item' });
  const action = useApiAction(context.addToast);

  const queryParams = (cursor) => {
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

  const loadItems = async (cursor = '') => {
    if (!context.projectId) {
      action.setError('Project ID is required');
      return;
    }
    const page = await action.run(() => context.services.workItems.listByProject(context.projectId, queryParams(cursor)));
    if (page) {
      const loaded = Array.isArray(page.items) ? page.items : [];
      setItems(cursor ? [...items, ...loaded] : loaded);
      setNextCursor(page.nextCursor || '');
    }
  };

  const create = async (event) => {
    event.preventDefault();
    if (!context.projectId) {
      action.setError('Project ID is required');
      return;
    }
    const created = await action.run(() => context.services.workItems.create(context.projectId, newWorkItem), 'Work item created');
    if (created) {
      setSelected(created);
      await loadItems();
    }
  };

  const openItem = async (workItemId) => {
    const item = await action.run(() => context.services.workItems.get(workItemId));
    if (item) {
      setSelected(item);
    }
  };

  return (
    <Panel title="Project Work" icon={<FiList />} wide>
      <div className="work-layout">
        <form className="stack" onSubmit={(event) => { event.preventDefault(); loadItems(); }}>
          <div className="two-column compact">
            <TextField label="Project ID" value={context.projectId} onChange={context.setProjectId} />
            <TextField label="Custom field" value={workQuery.customFieldKey} onChange={(customFieldKey) => setWorkQuery({ ...workQuery, customFieldKey })} />
            <SelectField label="Operator" value={workQuery.customFieldOperator} onChange={(customFieldOperator) => setWorkQuery({ ...workQuery, customFieldOperator })} options={['eq', 'ne', 'contains', 'not_contains', 'in', 'gt', 'gte', 'lt', 'lte', 'between']} />
            <TextField label="Value" value={workQuery.customFieldValue} onChange={(customFieldValue) => setWorkQuery({ ...workQuery, customFieldValue })} />
            <TextField label="Value to" value={workQuery.customFieldValueTo} onChange={(customFieldValueTo) => setWorkQuery({ ...workQuery, customFieldValueTo })} />
          </div>
          <div className="button-row">
            <button className="primary-button" disabled={action.pending} type="submit"><FiRefreshCw />Load</button>
            <button className="secondary-button" disabled={!nextCursor || action.pending} onClick={() => loadItems(nextCursor)} type="button">More</button>
          </div>
        </form>
        <form className="stack create-strip" onSubmit={create}>
          <TextField label="Type key" value={newWorkItem.typeKey} onChange={(typeKey) => setNewWorkItem({ ...newWorkItem, typeKey })} />
          <TextField label="Title" value={newWorkItem.title} onChange={(title) => setNewWorkItem({ ...newWorkItem, title })} />
          <button className="secondary-button" disabled={action.pending} type="submit"><FiPlus />Create</button>
        </form>
        <ErrorLine message={action.error} />
        <div className="work-columns">
          <ResultList items={items} titleKey="title" eyebrowKey="key" onOpen={(item) => openItem(item.id)} />
          <JsonPreview title="Detail" value={selected} />
        </div>
      </div>
    </Panel>
  );
};

const PlanningPage = ({ context }) => {
  const [teams, setTeams] = useState([]);
  const [projectTeams, setProjectTeams] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [teamForm, setTeamForm] = useState({ name: 'Delivery Team', description: '', defaultCapacity: '100', status: 'active' });
  const [projectTeamForm, setProjectTeamForm] = useState({ teamId: '', role: 'delivery' });
  const [iterationForm, setIterationForm] = useState({ name: 'Sprint 1', teamId: '', startDate: '2026-04-20', endDate: '2026-05-01', status: 'planned' });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId || !context.projectId) {
      action.setError('Workspace ID and Project ID are required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.planning.listTeams(context.workspaceId),
      context.services.planning.listProjectTeams(context.projectId),
      context.services.planning.listIterations(context.projectId),
    ]));
    if (result) {
      const [teamRows, projectTeamRows, iterationRows] = result;
      setTeams(teamRows || []);
      setProjectTeams(projectTeamRows || []);
      setIterations(iterationRows || []);
    }
  };

  const createTeam = async (event) => {
    event.preventDefault();
    const team = await action.run(() => context.services.planning.createTeam(context.workspaceId, {
      ...teamForm,
      defaultCapacity: Number(teamForm.defaultCapacity || 100),
    }), 'Team created');
    if (team) {
      setTeamForm({ ...teamForm, name: '' });
      await load();
    }
  };

  const assignTeam = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.planning.assignProjectTeam(context.projectId, projectTeamForm.teamId, {
      role: projectTeamForm.role,
    }), 'Team assigned');
    await load();
  };

  const createIteration = async (event) => {
    event.preventDefault();
    const iteration = await action.run(() => context.services.planning.createIteration(context.projectId, {
      ...iterationForm,
      teamId: iterationForm.teamId || undefined,
    }), 'Iteration created');
    if (iteration) {
      await load();
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Teams" icon={<FiUsers />}>
        <form className="stack" onSubmit={createTeam}>
          <TextField label="Name" value={teamForm.name} onChange={(name) => setTeamForm({ ...teamForm, name })} />
          <TextField label="Description" value={teamForm.description} onChange={(description) => setTeamForm({ ...teamForm, description })} />
          <TextField label="Capacity" type="number" value={teamForm.defaultCapacity} onChange={(defaultCapacity) => setTeamForm({ ...teamForm, defaultCapacity })} />
          <SelectField label="Status" value={teamForm.status} onChange={(status) => setTeamForm({ ...teamForm, status })} options={['active', 'inactive']} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create team</button>
        </form>
      </Panel>
      <Panel title="Project Team" icon={<FiLayers />}>
        <form className="stack" onSubmit={assignTeam}>
          <TextField label="Team ID" value={projectTeamForm.teamId} onChange={(teamId) => setProjectTeamForm({ ...projectTeamForm, teamId })} />
          <TextField label="Role" value={projectTeamForm.role} onChange={(role) => setProjectTeamForm({ ...projectTeamForm, role })} />
          <button className="primary-button" disabled={action.pending || !context.projectId || !projectTeamForm.teamId} type="submit"><FiCheck />Assign</button>
        </form>
      </Panel>
      <Panel title="Iterations" icon={<FiActivity />} wide>
        <form className="stack create-strip" onSubmit={createIteration}>
          <TextField label="Name" value={iterationForm.name} onChange={(name) => setIterationForm({ ...iterationForm, name })} />
          <TextField label="Team ID" value={iterationForm.teamId} onChange={(teamId) => setIterationForm({ ...iterationForm, teamId })} />
          <TextField label="Start" value={iterationForm.startDate} onChange={(startDate) => setIterationForm({ ...iterationForm, startDate })} />
          <TextField label="End" value={iterationForm.endDate} onChange={(endDate) => setIterationForm({ ...iterationForm, endDate })} />
          <button className="secondary-button" disabled={action.pending || !context.projectId} type="submit"><FiPlus />Create</button>
        </form>
        <div className="button-row">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
        </div>
        <ErrorLine message={action.error} />
        <div className="data-columns">
          <JsonPreview title="Teams" value={teams} />
          <JsonPreview title="Project Teams" value={projectTeams} />
          <JsonPreview title="Iterations" value={iterations} />
        </div>
      </Panel>
    </div>
  );
};

const SearchPage = ({ context }) => {
  const [filters, setFilters] = useState([]);
  const [views, setViews] = useState([]);
  const [results, setResults] = useState(null);
  const [filterForm, setFilterForm] = useState({
    name: 'Open work search',
    visibility: 'project',
    projectId: context.projectId,
    teamId: '',
    sortField: 'workspaceSequenceNumber',
    sortDirection: 'asc',
    queryText: JSON.stringify({ ...defaultSavedFilterQuery, projectId: context.projectId }, null, 2),
  });
  const [viewForm, setViewForm] = useState({
    name: 'Project work view',
    viewType: 'work_items',
    visibility: 'project',
    configText: JSON.stringify({ columns: ['key', 'title', 'statusKey', 'assigneeId'] }, null, 2),
  });
  const action = useApiAction(context.addToast);

  useEffect(() => {
    setFilterForm((current) => {
      if (current.projectId || !context.projectId) {
        return current;
      }
      return {
        ...current,
        projectId: context.projectId,
        queryText: JSON.stringify({ ...defaultSavedFilterQuery, projectId: context.projectId }, null, 2),
      };
    });
  }, [context.projectId]);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.search.listSavedFilters(context.workspaceId),
      context.services.search.listSavedViews(context.workspaceId),
    ]));
    if (result) {
      const [filterRows, viewRows] = result;
      setFilters(filterRows || []);
      setViews(viewRows || []);
    }
  };

  const syncStructuredQuery = () => {
    const query = parseJson(filterForm.queryText, defaultSavedFilterQuery);
    query.entityType = 'work_item';
    query.projectId = filterForm.projectId || context.projectId || query.projectId;
    query.sort = [{ field: filterForm.sortField, direction: filterForm.sortDirection }];
    setFilterForm({ ...filterForm, queryText: JSON.stringify(query, null, 2) });
  };

  const createFilter = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => {
      const query = parseJsonOrThrow(filterForm.queryText);
      return context.services.search.createSavedFilter(context.workspaceId, {
        name: filterForm.name,
        visibility: filterForm.visibility,
        projectId: filterForm.visibility === 'project' ? filterForm.projectId || context.projectId : undefined,
        teamId: filterForm.visibility === 'team' ? filterForm.teamId : undefined,
        query,
      });
    }, 'Saved filter created');
    if (saved) {
      context.setSavedFilterId(saved.id || '');
      await load();
    }
  };

  const executeFilter = async (cursor = '') => {
    if (!context.savedFilterId) {
      action.setError('Saved filter ID is required');
      return;
    }
    const page = await action.run(() => context.services.search.executeSavedFilter(context.savedFilterId, {
      limit: 25,
      cursor: cursor || undefined,
    }));
    if (page) {
      setResults(page);
    }
  };

  const createView = async (event) => {
    event.preventDefault();
    const saved = await action.run(() => context.services.search.createSavedView(context.workspaceId, {
      name: viewForm.name,
      viewType: viewForm.viewType,
      visibility: viewForm.visibility,
      projectId: viewForm.visibility === 'project' ? context.projectId : undefined,
      config: parseJsonOrThrow(viewForm.configText),
    }), 'Saved view created');
    if (saved) {
      await load();
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Saved Filter Builder" icon={<FiFilter />} wide>
        <form className="stack" onSubmit={createFilter}>
          <div className="two-column compact">
            <TextField label="Name" value={filterForm.name} onChange={(name) => setFilterForm({ ...filterForm, name })} />
            <SelectField label="Visibility" value={filterForm.visibility} onChange={(visibility) => setFilterForm({ ...filterForm, visibility })} options={['private', 'project', 'team', 'workspace', 'public']} />
            <TextField label="Project ID" value={filterForm.projectId} onChange={(projectId) => setFilterForm({ ...filterForm, projectId })} />
            <TextField label="Team ID" value={filterForm.teamId} onChange={(teamId) => setFilterForm({ ...filterForm, teamId })} />
            <SelectField label="Sort" value={filterForm.sortField} onChange={(sortField) => setFilterForm({ ...filterForm, sortField })} options={['workspaceSequenceNumber', 'rank', 'createdAt', 'updatedAt', 'dueDate', 'priority']} />
            <SelectField label="Direction" value={filterForm.sortDirection} onChange={(sortDirection) => setFilterForm({ ...filterForm, sortDirection })} options={['asc', 'desc']} />
          </div>
          <button className="secondary-button" onClick={syncStructuredQuery} type="button"><FiSettings />Sync</button>
          <Field label="Expert JSON">
            <textarea value={filterForm.queryText} onChange={(event) => setFilterForm({ ...filterForm, queryText: event.target.value })} rows={14} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create filter</button>
            <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          </div>
        </form>
      </Panel>
      <Panel title="Execute" icon={<FiEye />}>
        <div className="stack">
          <TextField label="Saved filter ID" value={context.savedFilterId} onChange={context.setSavedFilterId} />
          <button className="primary-button" disabled={action.pending || !context.savedFilterId} onClick={() => executeFilter()} type="button"><FiRefreshCw />Run</button>
          <button className="secondary-button" disabled={action.pending || !results?.nextCursor} onClick={() => executeFilter(results.nextCursor)} type="button">More</button>
          <ErrorLine message={action.error} />
        </div>
        <JsonPreview title="Results" value={results} />
      </Panel>
      <Panel title="Saved View" icon={<FiLayers />}>
        <form className="stack" onSubmit={createView}>
          <TextField label="Name" value={viewForm.name} onChange={(name) => setViewForm({ ...viewForm, name })} />
          <SelectField label="Visibility" value={viewForm.visibility} onChange={(visibility) => setViewForm({ ...viewForm, visibility })} options={['private', 'project', 'team', 'workspace', 'public']} />
          <Field label="Config JSON">
            <textarea value={viewForm.configText} onChange={(event) => setViewForm({ ...viewForm, configText: event.target.value })} rows={8} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create view</button>
        </form>
      </Panel>
      <Panel title="Catalog" icon={<FiDatabase />} wide>
        <div className="data-columns two">
          <JsonPreview title="Filters" value={filters} />
          <JsonPreview title="Views" value={views} />
        </div>
      </Panel>
    </div>
  );
};

const DashboardsPage = ({ context }) => {
  const [dashboards, setDashboards] = useState([]);
  const [rendered, setRendered] = useState(null);
  const [dashboardForm, setDashboardForm] = useState({ name: 'Project Health', visibility: 'project', layoutText: JSON.stringify({ columns: 12 }, null, 2) });
  const [widgetForm, setWidgetForm] = useState({
    widgetType: 'project_summary',
    title: 'Project Summary',
    configText: JSON.stringify({ report: 'project_dashboard_summary' }, null, 2),
    positionX: '0',
    positionY: '0',
    width: '6',
    height: '4',
  });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const rows = await action.run(() => context.services.dashboards.list(context.workspaceId));
    if (rows) {
      setDashboards(rows || []);
    }
  };

  const createDashboard = async (event) => {
    event.preventDefault();
    const dashboard = await action.run(() => context.services.dashboards.create(context.workspaceId, {
      name: dashboardForm.name,
      visibility: dashboardForm.visibility,
      projectId: dashboardForm.visibility === 'project' ? context.projectId : undefined,
      layout: parseJsonOrThrow(dashboardForm.layoutText),
    }), 'Dashboard created');
    if (dashboard) {
      context.setDashboardId(dashboard.id || '');
      await load();
    }
  };

  const createWidget = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.dashboards.createWidget(context.dashboardId, {
      widgetType: widgetForm.widgetType,
      title: widgetForm.title,
      config: parseJsonOrThrow(widgetForm.configText),
      positionX: Number(widgetForm.positionX || 0),
      positionY: Number(widgetForm.positionY || 0),
      width: Number(widgetForm.width || 4),
      height: Number(widgetForm.height || 4),
    }), 'Widget created');
    await renderDashboard();
  };

  const renderDashboard = async () => {
    if (!context.dashboardId) {
      action.setError('Dashboard ID is required');
      return;
    }
    const output = await action.run(() => context.services.dashboards.render(context.dashboardId));
    if (output) {
      setRendered(output);
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Dashboard Builder" icon={<FiBarChart2 />}>
        <form className="stack" onSubmit={createDashboard}>
          <TextField label="Name" value={dashboardForm.name} onChange={(name) => setDashboardForm({ ...dashboardForm, name })} />
          <SelectField label="Visibility" value={dashboardForm.visibility} onChange={(visibility) => setDashboardForm({ ...dashboardForm, visibility })} options={['private', 'project', 'team', 'workspace', 'public']} />
          <Field label="Layout JSON">
            <textarea value={dashboardForm.layoutText} onChange={(event) => setDashboardForm({ ...dashboardForm, layoutText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create dashboard</button>
        </form>
      </Panel>
      <Panel title="Widget" icon={<FiActivity />}>
        <form className="stack" onSubmit={createWidget}>
          <TextField label="Dashboard ID" value={context.dashboardId} onChange={context.setDashboardId} />
          <TextField label="Type" value={widgetForm.widgetType} onChange={(widgetType) => setWidgetForm({ ...widgetForm, widgetType })} />
          <TextField label="Title" value={widgetForm.title} onChange={(title) => setWidgetForm({ ...widgetForm, title })} />
          <Field label="Config JSON">
            <textarea value={widgetForm.configText} onChange={(event) => setWidgetForm({ ...widgetForm, configText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <div className="four-column">
            <TextField label="X" type="number" value={widgetForm.positionX} onChange={(positionX) => setWidgetForm({ ...widgetForm, positionX })} />
            <TextField label="Y" type="number" value={widgetForm.positionY} onChange={(positionY) => setWidgetForm({ ...widgetForm, positionY })} />
            <TextField label="W" type="number" value={widgetForm.width} onChange={(width) => setWidgetForm({ ...widgetForm, width })} />
            <TextField label="H" type="number" value={widgetForm.height} onChange={(height) => setWidgetForm({ ...widgetForm, height })} />
          </div>
          <button className="primary-button" disabled={action.pending || !context.dashboardId} type="submit"><FiPlus />Add widget</button>
        </form>
      </Panel>
      <Panel title="Render" icon={<FiEye />} wide>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          <button className="primary-button" disabled={action.pending || !context.dashboardId} onClick={renderDashboard} type="button"><FiRefreshCw />Render</button>
        </div>
        <ErrorLine message={action.error} />
        <div className="data-columns two">
          <JsonPreview title="Dashboards" value={dashboards} />
          <JsonPreview title="Rendered" value={rendered} />
        </div>
      </Panel>
    </div>
  );
};

const AgentsPage = ({ context }) => {
  const [providers, setProviders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [repositories, setRepositories] = useState([]);
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
    ]));
    if (result) {
      const [providerRows, profileRows, repoRows] = result;
      setProviders(providerRows || []);
      setProfiles(profileRows || []);
      setRepositories(repoRows || []);
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
          <TextField label="Provider ID" value={profileForm.providerId} onChange={(providerId) => setProfileForm({ ...profileForm, providerId })} />
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
            <TextField label="Work item ID" value={taskForm.workItemId} onChange={(workItemId) => setTaskForm({ ...taskForm, workItemId })} />
            <TextField label="Agent profile ID" value={taskForm.agentProfileId} onChange={(agentProfileId) => setTaskForm({ ...taskForm, agentProfileId })} />
          </div>
          <TextField label="Repository IDs" value={taskForm.repositoryConnectionIds} onChange={(repositoryConnectionIds) => setTaskForm({ ...taskForm, repositoryConnectionIds })} />
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
          <JsonPreview title="Task" value={task} />
        </div>
      </Panel>
    </div>
  );
};

const TokenAdminPage = ({ context }) => {
  const [personalTokens, setPersonalTokens] = useState([]);
  const [serviceTokens, setServiceTokens] = useState([]);
  const [createdToken, setCreatedToken] = useState(null);
  const [personalForm, setPersonalForm] = useState({ name: 'Local API token', scopes: 'work_item.read,report.read', expiresAt: '' });
  const [serviceForm, setServiceForm] = useState({ name: 'Worker token', username: 'service-worker', displayName: 'Service Worker', roleId: '', scopes: 'work_item.read,agent.manage', expiresAt: '' });
  const action = useApiAction(context.addToast);

  const load = async () => {
    const personal = await action.run(() => context.services.auth.listPersonalTokens());
    if (personal) {
      setPersonalTokens(personal || []);
    }
    if (context.workspaceId) {
      const service = await action.run(() => context.services.auth.listServiceTokens(context.workspaceId));
      if (service) {
        setServiceTokens(service || []);
      }
    }
  };

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
      <Panel title="Service Token" icon={<FiSettings />}>
        <form className="stack" onSubmit={createService}>
          <TextField label="Name" value={serviceForm.name} onChange={(name) => setServiceForm({ ...serviceForm, name })} />
          <TextField label="Username" value={serviceForm.username} onChange={(username) => setServiceForm({ ...serviceForm, username })} />
          <TextField label="Display name" value={serviceForm.displayName} onChange={(displayName) => setServiceForm({ ...serviceForm, displayName })} />
          <TextField label="Role ID" value={serviceForm.roleId} onChange={(roleId) => setServiceForm({ ...serviceForm, roleId })} />
          <TextField label="Scopes" value={serviceForm.scopes} onChange={(scopes) => setServiceForm({ ...serviceForm, scopes })} />
          <TextField label="Expires at" value={serviceForm.expiresAt} onChange={(expiresAt) => setServiceForm({ ...serviceForm, expiresAt })} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId || !serviceForm.roleId} type="submit"><FiPlus />Create service token</button>
        </form>
      </Panel>
      <Panel title="Tokens" icon={<FiEye />} wide>
        <div className="button-row">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
        </div>
        <ErrorLine message={action.error} />
        <div className="data-columns">
          <JsonPreview title="New Token" value={createdToken} />
          <JsonPreview title="Personal" value={personalTokens} />
          <JsonPreview title="Service" value={serviceTokens} />
        </div>
      </Panel>
    </div>
  );
};

const useApiAction = (addToast) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const run = async (action, successMessage) => {
    setPending(true);
    setError('');
    try {
      const result = await action();
      if (successMessage) {
        addToast(successMessage, 'success');
      }
      return result;
    } catch (caught) {
      const message = apiErrorMessage(caught);
      setError(message);
      addToast(message, 'error');
      return undefined;
    } finally {
      setPending(false);
    }
  };

  return { pending, error, run, setError };
};

const RouteLink = ({ icon, label, to }) => (
  <NavLink className={({ isActive }) => `route-tab${isActive ? ' active' : ''}`} end={to === '/'} to={to}>
    {icon}
    <span>{label}</span>
  </NavLink>
);

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

const TextField = ({ label, onChange, type = 'text', value }) => (
  <Field label={label}>
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
  </Field>
);

const SelectField = ({ label, onChange, options, value }) => (
  <Field label={label}>
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </Field>
);

const InlineId = ({ label, onChange, value }) => (
  <label className="inline-id">
    <span>{label}</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} />
  </label>
);

const ErrorLine = ({ message }) => (
  message ? <p className="error-line">{message}</p> : null
);

const StatusPill = ({ active, label }) => (
  <span className={`status-pill${active ? ' active' : ''}`}>
    {label}
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

const ResultList = ({ eyebrowKey, items, onOpen, titleKey }) => (
  <div className="work-list">
    {items.length === 0 ? (
      <EmptyState label="No records loaded" />
    ) : items.map((item) => (
      <button className="work-row" key={item.id} onClick={() => onOpen(item)} type="button">
        <span className="work-key">{item[eyebrowKey] || item.id}</span>
        <span className="work-title">{item[titleKey] || item.name || item.displayName || item.id}</span>
        <FiEye />
      </button>
    ))}
  </div>
);

const EmptyState = ({ label }) => (
  <div className="empty-state">{label}</div>
);

const JsonPreview = ({ title, value }) => (
  <section className="json-preview">
    {title && <h3>{title}</h3>}
    <pre>{value ? JSON.stringify(value, null, 2) : 'None'}</pre>
  </section>
);

const ToastStack = ({ items, onDismiss }) => (
  <div className="toast-stack" aria-live="polite">
    {items.map((item) => (
      <button className={`toast ${item.tone}`} key={item.id} onClick={() => onDismiss(item.id)} type="button">
        {item.message}
      </button>
    ))}
  </div>
);

const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
};

const parseJsonOrThrow = (value) => {
  try {
    return JSON.parse(value || '{}');
  } catch {
    throw new Error('JSON is invalid');
  }
};

const csv = (value) => value.split(',').map((entry) => entry.trim()).filter(Boolean);

export default App;
