import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiBell,
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
  FiSliders,
  FiUploadCloud,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { DEFAULT_API_BASE_URL, apiErrorMessage, createTrasckApiClient, normalizeBaseUrl } from './api/client';
import { createAgentsService } from './api/services/agentsService';
import { createAuthService } from './api/services/authService';
import { createAutomationService } from './api/services/automationService';
import { createConfigurationService } from './api/services/configurationService';
import { createDashboardsService } from './api/services/dashboardsService';
import { createImportsService } from './api/services/importsService';
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
    automation: createAutomationService(api),
    configuration: createConfigurationService(api),
    dashboards: createDashboardsService(api),
    imports: createImportsService(api),
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
            <Route path="/configuration" element={<ConfigurationPage context={context} />} />
            <Route path="/automation" element={<AutomationPage context={context} />} />
            <Route path="/imports" element={<ImportsPage context={context} />} />
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
        <RouteLink to="/configuration" icon={<FiSliders />} label="Config" />
        <RouteLink to="/automation" icon={<FiBell />} label="Automation" />
        <RouteLink to="/imports" icon={<FiUploadCloud />} label="Imports" />
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
        <NavLink className="action-tile" to="/configuration"><FiSliders /> Config</NavLink>
        <NavLink className="action-tile" to="/filters"><FiFilter /> Filters</NavLink>
        <NavLink className="action-tile" to="/dashboards"><FiBarChart2 /> Dashboards</NavLink>
      </div>
    </Panel>
    <Panel title="Automation" icon={<FiCpu />}>
      <div className="action-grid">
        <NavLink className="action-tile" to="/automation"><FiBell /> Rules</NavLink>
        <NavLink className="action-tile" to="/imports"><FiUploadCloud /> Imports</NavLink>
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
  const [workItems, setWorkItems] = useState([]);
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState('');
  const [boardColumns, setBoardColumns] = useState([]);
  const [boardSwimlanes, setBoardSwimlanes] = useState([]);
  const [boardWorkItems, setBoardWorkItems] = useState(null);
  const [releases, setReleases] = useState([]);
  const [releaseId, setReleaseId] = useState('');
  const [releaseWorkItems, setReleaseWorkItems] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [roadmapId, setRoadmapId] = useState('');
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [teamForm, setTeamForm] = useState({ name: 'Delivery Team', description: '', defaultCapacity: '100', status: 'active' });
  const [projectTeamForm, setProjectTeamForm] = useState({ teamId: '', role: 'delivery' });
  const [iterationForm, setIterationForm] = useState({ name: 'Sprint 1', teamId: '', startDate: '2026-04-20', endDate: '2026-05-01', status: 'planned' });
  const [boardForm, setBoardForm] = useState({ name: 'Project Board', type: 'kanban', teamId: '', filterConfigText: JSON.stringify({ projectScoped: true }, null, 2) });
  const [columnForm, setColumnForm] = useState({ name: 'Ready', statusIdsText: '[]', position: '1', wipLimit: '', doneColumn: 'false' });
  const [swimlaneForm, setSwimlaneForm] = useState({ name: 'Team lanes', swimlaneType: 'team', queryText: JSON.stringify({ field: 'teamId' }, null, 2), position: '1', enabled: 'true' });
  const [releaseForm, setReleaseForm] = useState({ name: 'Release 1', version: '1.0.0', startDate: '2026-04-20', releaseDate: '2026-05-15', status: 'planned', description: '' });
  const [releaseItemForm, setReleaseItemForm] = useState({ workItemId: '' });
  const [roadmapForm, setRoadmapForm] = useState({ name: 'Product Roadmap', visibility: 'project', configText: JSON.stringify({ lanes: ['now', 'next', 'later'] }, null, 2) });
  const [roadmapItemForm, setRoadmapItemForm] = useState({ workItemId: '', startDate: '2026-04-20', endDate: '2026-05-15', position: '1', displayConfigText: JSON.stringify({ lane: 'now' }, null, 2) });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId || !context.projectId) {
      action.setError('Workspace ID and Project ID are required');
      return;
    }
    const result = await action.run(async () => {
      const [
        teamRows,
        projectTeamRows,
        iterationRows,
        boardRows,
        releaseRows,
        roadmapRows,
        workItemPage,
      ] = await Promise.all([
        context.services.planning.listTeams(context.workspaceId),
        context.services.planning.listProjectTeams(context.projectId),
        context.services.planning.listIterations(context.projectId),
        context.services.planning.listBoards(context.projectId),
        context.services.planning.listReleases(context.projectId),
        context.services.planning.listProjectRoadmaps(context.projectId),
        context.services.workItems.listByProject(context.projectId, { limit: 50 }),
      ]);
      const nextBoardId = boardId || firstId(boardRows);
      const nextReleaseId = releaseId || firstId(releaseRows);
      const nextRoadmapId = roadmapId || firstId(roadmapRows);
      const [columnRows, swimlaneRows, boardCards, releaseItems, roadmapRowsForSelected] = await Promise.all([
        nextBoardId ? context.services.planning.listBoardColumns(nextBoardId) : Promise.resolve([]),
        nextBoardId ? context.services.planning.listBoardSwimlanes(nextBoardId) : Promise.resolve([]),
        nextBoardId ? context.services.planning.listBoardWorkItems(nextBoardId, { limitPerColumn: 50 }) : Promise.resolve(null),
        nextReleaseId ? context.services.planning.listReleaseWorkItems(nextReleaseId) : Promise.resolve([]),
        nextRoadmapId ? context.services.planning.listRoadmapItems(nextRoadmapId) : Promise.resolve([]),
      ]);
      return {
        teamRows,
        projectTeamRows,
        iterationRows,
        boardRows,
        releaseRows,
        roadmapRows,
        workItemRows: workItemPage?.items || [],
        nextBoardId,
        nextReleaseId,
        nextRoadmapId,
        columnRows,
        swimlaneRows,
        boardCards,
        releaseItems,
        roadmapRowsForSelected,
      };
    });
    if (result) {
      setTeams(result.teamRows || []);
      setProjectTeams(result.projectTeamRows || []);
      setIterations(result.iterationRows || []);
      setBoards(result.boardRows || []);
      setReleases(result.releaseRows || []);
      setRoadmaps(result.roadmapRows || []);
      setWorkItems(result.workItemRows || []);
      setBoardId(result.nextBoardId || '');
      setReleaseId(result.nextReleaseId || '');
      setRoadmapId(result.nextRoadmapId || '');
      setBoardColumns(result.columnRows || []);
      setBoardSwimlanes(result.swimlaneRows || []);
      setBoardWorkItems(result.boardCards || null);
      setReleaseWorkItems(result.releaseItems || []);
      setRoadmapItems(result.roadmapRowsForSelected || []);
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
      setProjectTeamForm({ ...projectTeamForm, teamId: team.id || projectTeamForm.teamId });
      setBoardForm({ ...boardForm, teamId: team.id || boardForm.teamId });
      setIterationForm({ ...iterationForm, teamId: team.id || iterationForm.teamId });
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

  const createBoard = async (event) => {
    event.preventDefault();
    const board = await action.run(() => context.services.planning.createBoard(context.projectId, {
      name: boardForm.name,
      type: boardForm.type,
      teamId: boardForm.teamId || undefined,
      filterConfig: parseJsonOrThrow(boardForm.filterConfigText),
      active: true,
    }), 'Board created');
    if (board) {
      setBoardId(board.id || '');
      await load();
    }
  };

  const createColumn = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.planning.createBoardColumn(boardId, {
      name: columnForm.name,
      statusIds: parseJsonOrThrow(columnForm.statusIdsText),
      position: Number(columnForm.position || 0),
      wipLimit: numberOrUndefined(columnForm.wipLimit),
      doneColumn: columnForm.doneColumn === 'true',
    }), 'Column created');
    await loadBoardDetails();
  };

  const createSwimlane = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.planning.createBoardSwimlane(boardId, {
      name: swimlaneForm.name,
      swimlaneType: swimlaneForm.swimlaneType,
      query: parseJsonOrThrow(swimlaneForm.queryText),
      position: Number(swimlaneForm.position || 0),
      enabled: swimlaneForm.enabled === 'true',
    }), 'Swimlane created');
    await loadBoardDetails();
  };

  const loadBoardDetails = async () => {
    if (!boardId) {
      action.setError('Board is required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.planning.listBoardColumns(boardId),
      context.services.planning.listBoardSwimlanes(boardId),
      context.services.planning.listBoardWorkItems(boardId, { limitPerColumn: 50 }),
    ]));
    if (result) {
      const [columnRows, swimlaneRows, cardRows] = result;
      setBoardColumns(columnRows || []);
      setBoardSwimlanes(swimlaneRows || []);
      setBoardWorkItems(cardRows || null);
    }
  };

  const createRelease = async (event) => {
    event.preventDefault();
    const release = await action.run(() => context.services.planning.createRelease(context.projectId, {
      ...releaseForm,
      description: releaseForm.description || undefined,
    }), 'Release created');
    if (release) {
      setReleaseId(release.id || '');
      await load();
    }
  };

  const addReleaseWorkItem = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.planning.addReleaseWorkItem(releaseId, {
      workItemId: releaseItemForm.workItemId,
    }), 'Work item added');
    await loadReleaseDetails();
  };

  const loadReleaseDetails = async () => {
    if (!releaseId) {
      action.setError('Release is required');
      return;
    }
    const rows = await action.run(() => context.services.planning.listReleaseWorkItems(releaseId));
    if (rows) {
      setReleaseWorkItems(rows || []);
    }
  };

  const createRoadmap = async (event) => {
    event.preventDefault();
    const roadmap = await action.run(() => context.services.planning.createRoadmap(context.workspaceId, {
      projectId: context.projectId,
      name: roadmapForm.name,
      visibility: roadmapForm.visibility,
      config: parseJsonOrThrow(roadmapForm.configText),
    }), 'Roadmap created');
    if (roadmap) {
      setRoadmapId(roadmap.id || '');
      await load();
    }
  };

  const createRoadmapItem = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.planning.createRoadmapItem(roadmapId, {
      workItemId: roadmapItemForm.workItemId,
      startDate: roadmapItemForm.startDate || undefined,
      endDate: roadmapItemForm.endDate || undefined,
      position: Number(roadmapItemForm.position || 0),
      displayConfig: parseJsonOrThrow(roadmapItemForm.displayConfigText),
    }), 'Roadmap item created');
    await loadRoadmapDetails();
  };

  const loadRoadmapDetails = async () => {
    if (!roadmapId) {
      action.setError('Roadmap is required');
      return;
    }
    const rows = await action.run(() => context.services.planning.listRoadmapItems(roadmapId));
    if (rows) {
      setRoadmapItems(rows || []);
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
          <RecordSelect label="Team" records={teams} value={projectTeamForm.teamId} onChange={(teamId) => setProjectTeamForm({ ...projectTeamForm, teamId })} />
          <TextField label="Role" value={projectTeamForm.role} onChange={(role) => setProjectTeamForm({ ...projectTeamForm, role })} />
          <button className="primary-button" disabled={action.pending || !context.projectId || !projectTeamForm.teamId} type="submit"><FiCheck />Assign</button>
        </form>
      </Panel>
      <Panel title="Iterations" icon={<FiActivity />}>
        <form className="stack create-strip" onSubmit={createIteration}>
          <TextField label="Name" value={iterationForm.name} onChange={(name) => setIterationForm({ ...iterationForm, name })} />
          <RecordSelect label="Team" records={teams} value={iterationForm.teamId} onChange={(teamId) => setIterationForm({ ...iterationForm, teamId })} includeBlank />
          <TextField label="Start" value={iterationForm.startDate} onChange={(startDate) => setIterationForm({ ...iterationForm, startDate })} />
          <TextField label="End" value={iterationForm.endDate} onChange={(endDate) => setIterationForm({ ...iterationForm, endDate })} />
          <button className="secondary-button" disabled={action.pending || !context.projectId} type="submit"><FiPlus />Create</button>
        </form>
      </Panel>
      <Panel title="Board" icon={<FiList />}>
        <form className="stack" onSubmit={createBoard}>
          <TextField label="Name" value={boardForm.name} onChange={(name) => setBoardForm({ ...boardForm, name })} />
          <SelectField label="Type" value={boardForm.type} onChange={(type) => setBoardForm({ ...boardForm, type })} options={['kanban', 'scrum']} />
          <RecordSelect label="Team" records={teams} value={boardForm.teamId} onChange={(teamId) => setBoardForm({ ...boardForm, teamId })} includeBlank />
          <Field label="Filter JSON">
            <textarea value={boardForm.filterConfigText} onChange={(event) => setBoardForm({ ...boardForm, filterConfigText: event.target.value })} rows={5} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.projectId} type="submit"><FiPlus />Create board</button>
        </form>
      </Panel>
      <Panel title="Board Layout" icon={<FiSliders />}>
        <form className="stack" onSubmit={createColumn}>
          <RecordSelect label="Board" records={boards} value={boardId} onChange={setBoardId} />
          <TextField label="Column" value={columnForm.name} onChange={(name) => setColumnForm({ ...columnForm, name })} />
          <Field label="Status IDs JSON">
            <textarea value={columnForm.statusIdsText} onChange={(event) => setColumnForm({ ...columnForm, statusIdsText: event.target.value })} rows={3} spellCheck="false" />
          </Field>
          <div className="two-column compact">
            <TextField label="Position" type="number" value={columnForm.position} onChange={(position) => setColumnForm({ ...columnForm, position })} />
            <TextField label="WIP limit" type="number" value={columnForm.wipLimit} onChange={(wipLimit) => setColumnForm({ ...columnForm, wipLimit })} />
          </div>
          <SelectField label="Done" value={columnForm.doneColumn} onChange={(doneColumn) => setColumnForm({ ...columnForm, doneColumn })} options={['false', 'true']} />
          <button className="primary-button" disabled={action.pending || !boardId} type="submit"><FiPlus />Add column</button>
        </form>
        <form className="stack nested-form" onSubmit={createSwimlane}>
          <TextField label="Swimlane" value={swimlaneForm.name} onChange={(name) => setSwimlaneForm({ ...swimlaneForm, name })} />
          <SelectField label="Type" value={swimlaneForm.swimlaneType} onChange={(swimlaneType) => setSwimlaneForm({ ...swimlaneForm, swimlaneType })} options={['team', 'assignee', 'epic', 'query']} />
          <Field label="Query JSON">
            <textarea value={swimlaneForm.queryText} onChange={(event) => setSwimlaneForm({ ...swimlaneForm, queryText: event.target.value })} rows={3} spellCheck="false" />
          </Field>
          <button className="secondary-button" disabled={action.pending || !boardId} type="submit"><FiPlus />Add swimlane</button>
        </form>
      </Panel>
      <Panel title="Release" icon={<FiActivity />}>
        <form className="stack" onSubmit={createRelease}>
          <TextField label="Name" value={releaseForm.name} onChange={(name) => setReleaseForm({ ...releaseForm, name })} />
          <TextField label="Version" value={releaseForm.version} onChange={(version) => setReleaseForm({ ...releaseForm, version })} />
          <div className="two-column compact">
            <TextField label="Start" value={releaseForm.startDate} onChange={(startDate) => setReleaseForm({ ...releaseForm, startDate })} />
            <TextField label="Release" value={releaseForm.releaseDate} onChange={(releaseDate) => setReleaseForm({ ...releaseForm, releaseDate })} />
          </div>
          <SelectField label="Status" value={releaseForm.status} onChange={(status) => setReleaseForm({ ...releaseForm, status })} options={['planned', 'active', 'released', 'archived']} />
          <button className="primary-button" disabled={action.pending || !context.projectId} type="submit"><FiPlus />Create release</button>
        </form>
        <form className="stack nested-form" onSubmit={addReleaseWorkItem}>
          <RecordSelect label="Release" records={releases} value={releaseId} onChange={setReleaseId} />
          <RecordSelect label="Work item" records={workItems} value={releaseItemForm.workItemId} onChange={(workItemId) => setReleaseItemForm({ ...releaseItemForm, workItemId })} />
          <button className="secondary-button" disabled={action.pending || !releaseId || !releaseItemForm.workItemId} type="submit"><FiPlus />Add work</button>
        </form>
      </Panel>
      <Panel title="Roadmap" icon={<FiBarChart2 />}>
        <form className="stack" onSubmit={createRoadmap}>
          <TextField label="Name" value={roadmapForm.name} onChange={(name) => setRoadmapForm({ ...roadmapForm, name })} />
          <SelectField label="Visibility" value={roadmapForm.visibility} onChange={(visibility) => setRoadmapForm({ ...roadmapForm, visibility })} options={['private', 'project', 'workspace', 'public']} />
          <Field label="Config JSON">
            <textarea value={roadmapForm.configText} onChange={(event) => setRoadmapForm({ ...roadmapForm, configText: event.target.value })} rows={5} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId || !context.projectId} type="submit"><FiPlus />Create roadmap</button>
        </form>
        <form className="stack nested-form" onSubmit={createRoadmapItem}>
          <RecordSelect label="Roadmap" records={roadmaps} value={roadmapId} onChange={setRoadmapId} />
          <RecordSelect label="Work item" records={workItems} value={roadmapItemForm.workItemId} onChange={(workItemId) => setRoadmapItemForm({ ...roadmapItemForm, workItemId })} />
          <div className="two-column compact">
            <TextField label="Start" value={roadmapItemForm.startDate} onChange={(startDate) => setRoadmapItemForm({ ...roadmapItemForm, startDate })} />
            <TextField label="End" value={roadmapItemForm.endDate} onChange={(endDate) => setRoadmapItemForm({ ...roadmapItemForm, endDate })} />
          </div>
          <button className="secondary-button" disabled={action.pending || !roadmapId || !roadmapItemForm.workItemId} type="submit"><FiPlus />Add item</button>
        </form>
      </Panel>
      <Panel title="Planning Records" icon={<FiEye />} wide>
        <div className="button-row">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          <button className="secondary-button" disabled={action.pending || !boardId} onClick={loadBoardDetails} type="button">Board cards</button>
          <button className="secondary-button" disabled={action.pending || !releaseId} onClick={loadReleaseDetails} type="button">Release scope</button>
          <button className="secondary-button" disabled={action.pending || !roadmapId} onClick={loadRoadmapDetails} type="button">Roadmap items</button>
        </div>
        <ErrorLine message={action.error} />
        <div className="data-columns">
          <JsonPreview title="Teams" value={teams} />
          <JsonPreview title="Project Teams" value={projectTeams} />
          <JsonPreview title="Iterations" value={iterations} />
          <JsonPreview title="Boards" value={boards} />
          <JsonPreview title="Columns" value={boardColumns} />
          <JsonPreview title="Swimlanes" value={boardSwimlanes} />
          <JsonPreview title="Board Work" value={boardWorkItems} />
          <JsonPreview title="Releases" value={releases} />
          <JsonPreview title="Release Work" value={releaseWorkItems} />
          <JsonPreview title="Roadmaps" value={roadmaps} />
          <JsonPreview title="Roadmap Items" value={roadmapItems} />
          <JsonPreview title="Work Items" value={workItems} />
        </div>
      </Panel>
    </div>
  );
};

const ConfigurationPage = ({ context }) => {
  const [customFields, setCustomFields] = useState([]);
  const [fieldConfigurations, setFieldConfigurations] = useState([]);
  const [screens, setScreens] = useState([]);
  const [screenId, setScreenId] = useState('');
  const [screenFields, setScreenFields] = useState([]);
  const [screenAssignments, setScreenAssignments] = useState([]);
  const [fieldForm, setFieldForm] = useState({ name: 'Story Points', key: 'story_points', fieldType: 'number', optionsText: '{}', searchable: 'true' });
  const [contextForm, setContextForm] = useState({ customFieldId: '', required: 'false', defaultValueText: 'null', validationConfigText: '{}' });
  const [configurationForm, setConfigurationForm] = useState({ customFieldId: '', required: 'false', hidden: 'false', defaultValueText: 'null', validationConfigText: '{}' });
  const [screenForm, setScreenForm] = useState({ name: 'Story Edit', screenType: 'edit', configText: '{}' });
  const [screenFieldForm, setScreenFieldForm] = useState({ customFieldId: '', systemFieldKey: '', position: '1', required: 'false' });
  const [assignmentForm, setAssignmentForm] = useState({ operation: 'edit', priority: '100' });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(async () => {
      const [fieldRows, configRows, screenRows] = await Promise.all([
        context.services.configuration.listCustomFields(context.workspaceId),
        context.services.configuration.listFieldConfigurations(context.workspaceId),
        context.services.configuration.listScreens(context.workspaceId),
      ]);
      const nextScreenId = screenId || firstId(screenRows);
      const [screenFieldRows, assignmentRows] = await Promise.all([
        nextScreenId ? context.services.configuration.listScreenFields(nextScreenId) : Promise.resolve([]),
        nextScreenId ? context.services.configuration.listScreenAssignments(nextScreenId) : Promise.resolve([]),
      ]);
      return { fieldRows, configRows, screenRows, nextScreenId, screenFieldRows, assignmentRows };
    });
    if (result) {
      setCustomFields(result.fieldRows || []);
      setFieldConfigurations(result.configRows || []);
      setScreens(result.screenRows || []);
      setScreenId(result.nextScreenId || '');
      setScreenFields(result.screenFieldRows || []);
      setScreenAssignments(result.assignmentRows || []);
      const nextFieldId = firstId(result.fieldRows) || '';
      if (nextFieldId && !contextForm.customFieldId) {
        setContextForm((current) => ({ ...current, customFieldId: nextFieldId }));
        setConfigurationForm((current) => ({ ...current, customFieldId: nextFieldId }));
        setScreenFieldForm((current) => ({ ...current, customFieldId: nextFieldId }));
      }
    }
  };

  const createCustomField = async (event) => {
    event.preventDefault();
    const field = await action.run(() => context.services.configuration.createCustomField(context.workspaceId, {
      name: fieldForm.name,
      key: fieldForm.key,
      fieldType: fieldForm.fieldType,
      options: parseJsonOrThrow(fieldForm.optionsText),
      searchable: fieldForm.searchable === 'true',
      archived: false,
    }), 'Custom field created');
    if (field) {
      setContextForm({ ...contextForm, customFieldId: field.id || contextForm.customFieldId });
      setConfigurationForm({ ...configurationForm, customFieldId: field.id || configurationForm.customFieldId });
      setScreenFieldForm({ ...screenFieldForm, customFieldId: field.id || screenFieldForm.customFieldId });
      await load();
    }
  };

  const createFieldContext = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.configuration.createCustomFieldContext(contextForm.customFieldId, {
      projectId: context.projectId || undefined,
      required: contextForm.required === 'true',
      defaultValue: parseJsonOrThrow(contextForm.defaultValueText),
      validationConfig: parseJsonOrThrow(contextForm.validationConfigText),
    }), 'Field context created');
    await load();
  };

  const createFieldConfiguration = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.configuration.createFieldConfiguration(context.workspaceId, {
      customFieldId: configurationForm.customFieldId,
      projectId: context.projectId || undefined,
      required: configurationForm.required === 'true',
      hidden: configurationForm.hidden === 'true',
      defaultValue: parseJsonOrThrow(configurationForm.defaultValueText),
      validationConfig: parseJsonOrThrow(configurationForm.validationConfigText),
    }), 'Field configuration created');
    await load();
  };

  const createScreen = async (event) => {
    event.preventDefault();
    const screen = await action.run(() => context.services.configuration.createScreen(context.workspaceId, {
      name: screenForm.name,
      screenType: screenForm.screenType,
      config: parseJsonOrThrow(screenForm.configText),
    }), 'Screen created');
    if (screen) {
      setScreenId(screen.id || '');
      await load();
    }
  };

  const loadScreenDetails = async () => {
    if (!screenId) {
      action.setError('Screen is required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.configuration.listScreenFields(screenId),
      context.services.configuration.listScreenAssignments(screenId),
    ]));
    if (result) {
      const [fieldRows, assignmentRows] = result;
      setScreenFields(fieldRows || []);
      setScreenAssignments(assignmentRows || []);
    }
  };

  const addScreenField = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.configuration.addScreenField(screenId, {
      customFieldId: screenFieldForm.customFieldId || undefined,
      systemFieldKey: screenFieldForm.systemFieldKey || undefined,
      position: Number(screenFieldForm.position || 0),
      required: screenFieldForm.required === 'true',
    }), 'Screen field added');
    await loadScreenDetails();
  };

  const addScreenAssignment = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.configuration.addScreenAssignment(screenId, {
      projectId: context.projectId || undefined,
      operation: assignmentForm.operation,
      priority: Number(assignmentForm.priority || 0),
    }), 'Screen assigned');
    await loadScreenDetails();
  };

  return (
    <div className="content-grid">
      <Panel title="Custom Field" icon={<FiSliders />}>
        <form className="stack" onSubmit={createCustomField}>
          <TextField label="Name" value={fieldForm.name} onChange={(name) => setFieldForm({ ...fieldForm, name })} />
          <TextField label="Key" value={fieldForm.key} onChange={(key) => setFieldForm({ ...fieldForm, key })} />
          <SelectField label="Type" value={fieldForm.fieldType} onChange={(fieldType) => setFieldForm({ ...fieldForm, fieldType })} options={['text', 'number', 'date', 'datetime', 'boolean', 'single_select', 'multi_select', 'json']} />
          <SelectField label="Searchable" value={fieldForm.searchable} onChange={(searchable) => setFieldForm({ ...fieldForm, searchable })} options={['true', 'false']} />
          <Field label="Options JSON">
            <textarea value={fieldForm.optionsText} onChange={(event) => setFieldForm({ ...fieldForm, optionsText: event.target.value })} rows={5} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create field</button>
        </form>
      </Panel>
      <Panel title="Context" icon={<FiLayers />}>
        <form className="stack" onSubmit={createFieldContext}>
          <RecordSelect label="Custom field" records={customFields} value={contextForm.customFieldId} onChange={(customFieldId) => setContextForm({ ...contextForm, customFieldId })} />
          <SelectField label="Required" value={contextForm.required} onChange={(required) => setContextForm({ ...contextForm, required })} options={['false', 'true']} />
          <Field label="Default JSON">
            <textarea value={contextForm.defaultValueText} onChange={(event) => setContextForm({ ...contextForm, defaultValueText: event.target.value })} rows={3} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !contextForm.customFieldId} type="submit"><FiPlus />Add context</button>
        </form>
      </Panel>
      <Panel title="Field Configuration" icon={<FiSettings />}>
        <form className="stack" onSubmit={createFieldConfiguration}>
          <RecordSelect label="Custom field" records={customFields} value={configurationForm.customFieldId} onChange={(customFieldId) => setConfigurationForm({ ...configurationForm, customFieldId })} />
          <div className="two-column compact">
            <SelectField label="Required" value={configurationForm.required} onChange={(required) => setConfigurationForm({ ...configurationForm, required })} options={['false', 'true']} />
            <SelectField label="Hidden" value={configurationForm.hidden} onChange={(hidden) => setConfigurationForm({ ...configurationForm, hidden })} options={['false', 'true']} />
          </div>
          <Field label="Validation JSON">
            <textarea value={configurationForm.validationConfigText} onChange={(event) => setConfigurationForm({ ...configurationForm, validationConfigText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !configurationForm.customFieldId} type="submit"><FiPlus />Create config</button>
        </form>
      </Panel>
      <Panel title="Screen" icon={<FiEye />}>
        <form className="stack" onSubmit={createScreen}>
          <TextField label="Name" value={screenForm.name} onChange={(name) => setScreenForm({ ...screenForm, name })} />
          <SelectField label="Type" value={screenForm.screenType} onChange={(screenType) => setScreenForm({ ...screenForm, screenType })} options={['create', 'edit', 'view']} />
          <Field label="Config JSON">
            <textarea value={screenForm.configText} onChange={(event) => setScreenForm({ ...screenForm, configText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create screen</button>
        </form>
      </Panel>
      <Panel title="Screen Layout" icon={<FiList />} wide>
        <div className="data-columns two no-margin">
          <form className="stack" onSubmit={addScreenField}>
            <RecordSelect label="Screen" records={screens} value={screenId} onChange={setScreenId} />
            <RecordSelect label="Custom field" records={customFields} value={screenFieldForm.customFieldId} onChange={(customFieldId) => setScreenFieldForm({ ...screenFieldForm, customFieldId, systemFieldKey: '' })} includeBlank />
            <TextField label="System field" value={screenFieldForm.systemFieldKey} onChange={(systemFieldKey) => setScreenFieldForm({ ...screenFieldForm, systemFieldKey, customFieldId: '' })} />
            <div className="two-column compact">
              <TextField label="Position" type="number" value={screenFieldForm.position} onChange={(position) => setScreenFieldForm({ ...screenFieldForm, position })} />
              <SelectField label="Required" value={screenFieldForm.required} onChange={(required) => setScreenFieldForm({ ...screenFieldForm, required })} options={['false', 'true']} />
            </div>
            <button className="primary-button" disabled={action.pending || !screenId || (!screenFieldForm.customFieldId && !screenFieldForm.systemFieldKey)} type="submit"><FiPlus />Add field</button>
          </form>
          <form className="stack" onSubmit={addScreenAssignment}>
            <RecordSelect label="Screen" records={screens} value={screenId} onChange={setScreenId} />
            <SelectField label="Operation" value={assignmentForm.operation} onChange={(operation) => setAssignmentForm({ ...assignmentForm, operation })} options={['create', 'edit', 'view']} />
            <TextField label="Priority" type="number" value={assignmentForm.priority} onChange={(priority) => setAssignmentForm({ ...assignmentForm, priority })} />
            <button className="primary-button" disabled={action.pending || !screenId || !context.projectId} type="submit"><FiCheck />Assign screen</button>
          </form>
        </div>
        <div className="button-row">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          <button className="secondary-button" disabled={action.pending || !screenId} onClick={loadScreenDetails} type="button">Screen details</button>
        </div>
        <ErrorLine message={action.error} />
        <div className="data-columns">
          <JsonPreview title="Custom Fields" value={customFields} />
          <JsonPreview title="Field Configs" value={fieldConfigurations} />
          <JsonPreview title="Screens" value={screens} />
          <JsonPreview title="Screen Fields" value={screenFields} />
          <JsonPreview title="Assignments" value={screenAssignments} />
        </div>
      </Panel>
    </div>
  );
};

const AutomationPage = ({ context }) => {
  const [notifications, setNotifications] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [defaultPreferences, setDefaultPreferences] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [webhookId, setWebhookId] = useState('');
  const [webhookDeliveries, setWebhookDeliveries] = useState([]);
  const [webhookDeliveryId, setWebhookDeliveryId] = useState('');
  const [emailDeliveries, setEmailDeliveries] = useState([]);
  const [emailDeliveryId, setEmailDeliveryId] = useState('');
  const [workerSettings, setWorkerSettings] = useState(null);
  const [rules, setRules] = useState([]);
  const [ruleId, setRuleId] = useState('');
  const [jobs, setJobs] = useState([]);
  const [runResult, setRunResult] = useState(null);
  const [workItems, setWorkItems] = useState([]);
  const [preferenceForm, setPreferenceForm] = useState({ channel: 'in_app', eventType: 'work_item.updated', enabled: 'true', configText: '{}' });
  const [defaultPreferenceForm, setDefaultPreferenceForm] = useState({ channel: 'in_app', eventType: 'automation.rule_queued', enabled: 'true', configText: '{}' });
  const [webhookForm, setWebhookForm] = useState({ name: 'Automation Webhook', url: 'https://example.com/hooks/trasck', secret: '', eventTypesText: JSON.stringify(['automation.rule_executed'], null, 2), enabled: 'true' });
  const [ruleForm, setRuleForm] = useState({ name: 'Notify on update', triggerType: 'manual', triggerConfigText: '{}' });
  const [conditionForm, setConditionForm] = useState({ conditionType: 'always', configText: '{}', position: '1' });
  const [actionForm, setActionForm] = useState({ actionType: 'email', executionMode: 'async', configText: JSON.stringify({ toEmail: 'admin@trasck.local', subject: 'Automation ran', body: 'Trasck queued the email delivery action.' }, null, 2), position: '1' });
  const [executeForm, setExecuteForm] = useState({ sourceEntityType: 'work_item', sourceEntityId: '', payloadText: '{}' });
  const [workerForm, setWorkerForm] = useState({ limit: '10', maxAttempts: '3', dryRun: 'true' });
  const [workerSettingsForm, setWorkerSettingsForm] = useState({
    automationJobsEnabled: 'false',
    webhookDeliveriesEnabled: 'false',
    emailDeliveriesEnabled: 'false',
    automationLimit: '25',
    webhookLimit: '25',
    emailLimit: '25',
    webhookMaxAttempts: '3',
    emailMaxAttempts: '3',
    webhookDryRun: 'true',
    emailDryRun: 'true',
  });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(async () => {
      const [notificationPage, preferenceRows, defaultRows, webhookRows, ruleRows, workItemPage, settings, emailRows] = await Promise.all([
        context.services.automation.listNotifications(context.workspaceId, { limit: 25 }),
        context.services.automation.listPreferences(context.workspaceId),
        context.services.automation.listDefaultPreferences(context.workspaceId),
        context.services.automation.listWebhooks(context.workspaceId),
        context.services.automation.listRules(context.workspaceId),
        context.projectId ? context.services.workItems.listByProject(context.projectId, { limit: 50 }) : Promise.resolve({ items: [] }),
        context.services.automation.getWorkerSettings(context.workspaceId),
        context.services.automation.listEmailDeliveries(context.workspaceId),
      ]);
      const nextWebhookId = webhookId || firstId(webhookRows);
      const nextRuleId = ruleId || firstId(ruleRows);
      const nextEmailDeliveryId = emailDeliveryId || firstId(emailRows);
      const [deliveryRows, jobRows] = await Promise.all([
        nextWebhookId ? context.services.automation.listWebhookDeliveries(nextWebhookId) : Promise.resolve([]),
        nextRuleId ? context.services.automation.listJobs(nextRuleId) : Promise.resolve([]),
      ]);
      return { notificationPage, preferenceRows, defaultRows, webhookRows, ruleRows, workItemRows: workItemPage?.items || [], settings, emailRows, nextWebhookId, nextRuleId, nextEmailDeliveryId, deliveryRows, jobRows };
    });
    if (result) {
      setNotifications(result.notificationPage || null);
      setPreferences(result.preferenceRows || []);
      setDefaultPreferences(result.defaultRows || []);
      setWebhooks(result.webhookRows || []);
      setRules(result.ruleRows || []);
      setWorkItems(result.workItemRows || []);
      setWorkerSettings(result.settings || null);
      setEmailDeliveries(result.emailRows || []);
      setWebhookId(result.nextWebhookId || '');
      setRuleId(result.nextRuleId || '');
      setEmailDeliveryId(result.nextEmailDeliveryId || '');
      setWebhookDeliveries(result.deliveryRows || []);
      setWebhookDeliveryId(firstId(result.deliveryRows) || '');
      setJobs(result.jobRows || []);
      if (result.settings) {
        setWorkerSettingsForm(settingsToForm(result.settings));
      }
      if (!executeForm.sourceEntityId && firstId(result.workItemRows)) {
        setExecuteForm((current) => ({ ...current, sourceEntityId: firstId(result.workItemRows) }));
      }
    }
  };

  const savePreference = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.automation.upsertPreference(context.workspaceId, {
      channel: preferenceForm.channel,
      eventType: preferenceForm.eventType,
      enabled: preferenceForm.enabled === 'true',
      config: parseJsonOrThrow(preferenceForm.configText),
    }), 'Preference saved');
    await load();
  };

  const saveDefaultPreference = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.automation.upsertDefaultPreference(context.workspaceId, {
      channel: defaultPreferenceForm.channel,
      eventType: defaultPreferenceForm.eventType,
      enabled: defaultPreferenceForm.enabled === 'true',
      config: parseJsonOrThrow(defaultPreferenceForm.configText),
    }), 'Default saved');
    await load();
  };

  const createWebhook = async (event) => {
    event.preventDefault();
    const webhook = await action.run(() => context.services.automation.createWebhook(context.workspaceId, {
      name: webhookForm.name,
      url: webhookForm.url,
      secret: webhookForm.secret || undefined,
      eventTypes: parseJsonOrThrow(webhookForm.eventTypesText),
      enabled: webhookForm.enabled === 'true',
    }), 'Webhook created');
    if (webhook) {
      setWebhookId(webhook.id || '');
      await load();
    }
  };

  const createRule = async (event) => {
    event.preventDefault();
    const rule = await action.run(() => context.services.automation.createRule(context.workspaceId, {
      projectId: context.projectId || undefined,
      name: ruleForm.name,
      triggerType: ruleForm.triggerType,
      triggerConfig: parseJsonOrThrow(ruleForm.triggerConfigText),
      enabled: true,
    }), 'Rule created');
    if (rule) {
      setRuleId(rule.id || '');
      await load();
    }
  };

  const createCondition = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.automation.createCondition(ruleId, {
      conditionType: conditionForm.conditionType,
      config: parseJsonOrThrow(conditionForm.configText),
      position: Number(conditionForm.position || 0),
    }), 'Condition added');
    await loadRuleJobs();
  };

  const createAction = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.automation.createAction(ruleId, {
      actionType: actionForm.actionType,
      executionMode: actionForm.executionMode,
      config: parseJsonOrThrow(actionForm.configText),
      position: Number(actionForm.position || 0),
    }), 'Action added');
    await loadRuleJobs();
  };

  const executeRule = async (event) => {
    event.preventDefault();
    const execution = await action.run(() => context.services.automation.executeRule(ruleId, {
      sourceEntityType: executeForm.sourceEntityType,
      sourceEntityId: executeForm.sourceEntityId || undefined,
      payload: parseJsonOrThrow(executeForm.payloadText),
    }), 'Rule queued');
    if (execution) {
      setRunResult(execution);
      await loadRuleJobs();
    }
  };

  const loadRuleJobs = async () => {
    if (!ruleId) {
      action.setError('Automation rule is required');
      return;
    }
    const rows = await action.run(() => context.services.automation.listJobs(ruleId));
    if (rows) {
      setJobs(rows || []);
    }
  };

  const loadWebhookDeliveries = async () => {
    if (!webhookId) {
      action.setError('Webhook is required');
      return;
    }
    const rows = await action.run(() => context.services.automation.listWebhookDeliveries(webhookId));
    if (rows) {
      setWebhookDeliveries(rows || []);
    }
  };

  const runQueuedJobs = async () => {
    const result = await action.run(() => context.services.automation.runQueuedJobs(context.workspaceId, {
      limit: numberOrUndefined(workerForm.limit),
    }), 'Automation worker run');
    if (result) {
      setRunResult(result);
      await loadRuleJobs();
    }
  };

  const processDeliveries = async () => {
    const result = await action.run(() => context.services.automation.processWebhookDeliveries(context.workspaceId, {
      limit: numberOrUndefined(workerForm.limit),
      maxAttempts: numberOrUndefined(workerForm.maxAttempts),
      dryRun: workerForm.dryRun === 'true',
    }), 'Webhook worker run');
    if (result) {
      setRunResult(result);
      await loadWebhookDeliveries();
    }
  };

  const processEmails = async () => {
    const result = await action.run(() => context.services.automation.processEmailDeliveries(context.workspaceId, {
      limit: numberOrUndefined(workerForm.limit),
      maxAttempts: numberOrUndefined(workerForm.maxAttempts),
      dryRun: workerForm.dryRun === 'true',
    }), 'Email worker run');
    if (result) {
      setRunResult(result);
      await loadEmailDeliveries();
    }
  };

  const saveWorkerSettings = async () => {
    const settings = await action.run(() => context.services.automation.updateWorkerSettings(context.workspaceId, {
      automationJobsEnabled: workerSettingsForm.automationJobsEnabled === 'true',
      webhookDeliveriesEnabled: workerSettingsForm.webhookDeliveriesEnabled === 'true',
      emailDeliveriesEnabled: workerSettingsForm.emailDeliveriesEnabled === 'true',
      automationLimit: numberOrUndefined(workerSettingsForm.automationLimit),
      webhookLimit: numberOrUndefined(workerSettingsForm.webhookLimit),
      emailLimit: numberOrUndefined(workerSettingsForm.emailLimit),
      webhookMaxAttempts: numberOrUndefined(workerSettingsForm.webhookMaxAttempts),
      emailMaxAttempts: numberOrUndefined(workerSettingsForm.emailMaxAttempts),
      webhookDryRun: workerSettingsForm.webhookDryRun === 'true',
      emailDryRun: workerSettingsForm.emailDryRun === 'true',
    }), 'Worker settings saved');
    if (settings) {
      setWorkerSettings(settings);
      setWorkerSettingsForm(settingsToForm(settings));
    }
  };

  const loadEmailDeliveries = async () => {
    const rows = await action.run(() => context.services.automation.listEmailDeliveries(context.workspaceId));
    if (rows) {
      setEmailDeliveries(rows || []);
      setEmailDeliveryId(emailDeliveryId || firstId(rows) || '');
    }
  };

  const webhookDeliveryCommand = async (command, success) => {
    if (!webhookDeliveryId) {
      action.setError('Webhook delivery is required');
      return;
    }
    const delivery = await action.run(() => command(webhookDeliveryId), success);
    if (delivery) {
      await loadWebhookDeliveries();
    }
  };

  const emailDeliveryCommand = async (command, success) => {
    if (!emailDeliveryId) {
      action.setError('Email delivery is required');
      return;
    }
    const delivery = await action.run(() => command(emailDeliveryId), success);
    if (delivery) {
      await loadEmailDeliveries();
    }
  };

  const useSelectedWebhookConfig = () => {
    if (!webhookId) {
      return;
    }
    setActionForm({
      ...actionForm,
      actionType: 'webhook',
      executionMode: 'async',
      configText: JSON.stringify({ webhookId }, null, 2),
    });
  };

  return (
    <div className="content-grid">
      <Panel title="Notification Preferences" icon={<FiBell />}>
        <form className="stack" onSubmit={savePreference}>
          <TextField label="Channel" value={preferenceForm.channel} onChange={(channel) => setPreferenceForm({ ...preferenceForm, channel })} />
          <TextField label="Event type" value={preferenceForm.eventType} onChange={(eventType) => setPreferenceForm({ ...preferenceForm, eventType })} />
          <SelectField label="Enabled" value={preferenceForm.enabled} onChange={(enabled) => setPreferenceForm({ ...preferenceForm, enabled })} options={['true', 'false']} />
          <Field label="Config JSON">
            <textarea value={preferenceForm.configText} onChange={(event) => setPreferenceForm({ ...preferenceForm, configText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiCheck />Save preference</button>
        </form>
        <form className="stack nested-form" onSubmit={saveDefaultPreference}>
          <TextField label="Default event" value={defaultPreferenceForm.eventType} onChange={(eventType) => setDefaultPreferenceForm({ ...defaultPreferenceForm, eventType })} />
          <SelectField label="Enabled" value={defaultPreferenceForm.enabled} onChange={(enabled) => setDefaultPreferenceForm({ ...defaultPreferenceForm, enabled })} options={['true', 'false']} />
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiCheck />Save default</button>
        </form>
      </Panel>
      <Panel title="Webhooks" icon={<FiSend />}>
        <form className="stack" onSubmit={createWebhook}>
          <TextField label="Name" value={webhookForm.name} onChange={(name) => setWebhookForm({ ...webhookForm, name })} />
          <TextField label="URL" value={webhookForm.url} onChange={(url) => setWebhookForm({ ...webhookForm, url })} />
          <TextField label="Secret" value={webhookForm.secret} onChange={(secret) => setWebhookForm({ ...webhookForm, secret })} />
          <Field label="Event types JSON">
            <textarea value={webhookForm.eventTypesText} onChange={(event) => setWebhookForm({ ...webhookForm, eventTypesText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create webhook</button>
        </form>
      </Panel>
      <Panel title="Automation Rule" icon={<FiCpu />}>
        <form className="stack" onSubmit={createRule}>
          <TextField label="Name" value={ruleForm.name} onChange={(name) => setRuleForm({ ...ruleForm, name })} />
          <SelectField label="Trigger" value={ruleForm.triggerType} onChange={(triggerType) => setRuleForm({ ...ruleForm, triggerType })} options={['manual', 'work_item.updated', 'work_item.created', 'schedule']} />
          <Field label="Trigger JSON">
            <textarea value={ruleForm.triggerConfigText} onChange={(event) => setRuleForm({ ...ruleForm, triggerConfigText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create rule</button>
        </form>
      </Panel>
      <Panel title="Conditions And Actions" icon={<FiSettings />}>
        <RecordSelect label="Rule" records={rules} value={ruleId} onChange={setRuleId} />
        <form className="stack nested-form" onSubmit={createCondition}>
          <TextField label="Condition" value={conditionForm.conditionType} onChange={(conditionType) => setConditionForm({ ...conditionForm, conditionType })} />
          <Field label="Config JSON">
            <textarea value={conditionForm.configText} onChange={(event) => setConditionForm({ ...conditionForm, configText: event.target.value })} rows={3} spellCheck="false" />
          </Field>
          <button className="secondary-button" disabled={action.pending || !ruleId} type="submit"><FiPlus />Add condition</button>
        </form>
        <form className="stack nested-form" onSubmit={createAction}>
          <SelectField label="Action" value={actionForm.actionType} onChange={(actionType) => setActionForm({ ...actionForm, actionType })} options={['notification', 'webhook', 'email', 'field_update', 'comment']} />
          <SelectField label="Execution" value={actionForm.executionMode} onChange={(executionMode) => setActionForm({ ...actionForm, executionMode })} options={['sync', 'async', 'hybrid']} />
          <Field label="Config JSON">
            <textarea value={actionForm.configText} onChange={(event) => setActionForm({ ...actionForm, configText: event.target.value })} rows={5} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="secondary-button" disabled={!webhookId} onClick={useSelectedWebhookConfig} type="button">Use webhook</button>
            <button className="primary-button" disabled={action.pending || !ruleId} type="submit"><FiPlus />Add action</button>
          </div>
        </form>
      </Panel>
      <Panel title="Execution" icon={<FiRefreshCw />} wide>
        <form className="stack create-strip" onSubmit={executeRule}>
          <RecordSelect label="Rule" records={rules} value={ruleId} onChange={setRuleId} />
          <SelectField label="Source" value={executeForm.sourceEntityType} onChange={(sourceEntityType) => setExecuteForm({ ...executeForm, sourceEntityType })} options={['work_item', 'project', 'workspace']} />
          <RecordSelect label="Work item" records={workItems} value={executeForm.sourceEntityId} onChange={(sourceEntityId) => setExecuteForm({ ...executeForm, sourceEntityId })} includeBlank />
          <button className="primary-button" disabled={action.pending || !ruleId} type="submit"><FiSend />Queue rule</button>
        </form>
        <div className="agent-command-strip compact-actions">
          <TextField label="Limit" type="number" value={workerForm.limit} onChange={(limit) => setWorkerForm({ ...workerForm, limit })} />
          <TextField label="Max attempts" type="number" value={workerForm.maxAttempts} onChange={(maxAttempts) => setWorkerForm({ ...workerForm, maxAttempts })} />
          <SelectField label="Dry run" value={workerForm.dryRun} onChange={(dryRun) => setWorkerForm({ ...workerForm, dryRun })} options={['true', 'false']} />
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={runQueuedJobs} type="button">Run jobs</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={processDeliveries} type="button">Run deliveries</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={processEmails} type="button">Run emails</button>
        </div>
        <div className="data-columns two no-margin">
          <div className="stack nested-form">
            <div className="two-column compact">
              <SelectField label="Job schedule" value={workerSettingsForm.automationJobsEnabled} onChange={(automationJobsEnabled) => setWorkerSettingsForm({ ...workerSettingsForm, automationJobsEnabled })} options={['false', 'true']} />
              <SelectField label="Webhook schedule" value={workerSettingsForm.webhookDeliveriesEnabled} onChange={(webhookDeliveriesEnabled) => setWorkerSettingsForm({ ...workerSettingsForm, webhookDeliveriesEnabled })} options={['false', 'true']} />
              <SelectField label="Email schedule" value={workerSettingsForm.emailDeliveriesEnabled} onChange={(emailDeliveriesEnabled) => setWorkerSettingsForm({ ...workerSettingsForm, emailDeliveriesEnabled })} options={['false', 'true']} />
              <TextField label="Job limit" type="number" value={workerSettingsForm.automationLimit} onChange={(automationLimit) => setWorkerSettingsForm({ ...workerSettingsForm, automationLimit })} />
              <TextField label="Webhook limit" type="number" value={workerSettingsForm.webhookLimit} onChange={(webhookLimit) => setWorkerSettingsForm({ ...workerSettingsForm, webhookLimit })} />
              <TextField label="Email limit" type="number" value={workerSettingsForm.emailLimit} onChange={(emailLimit) => setWorkerSettingsForm({ ...workerSettingsForm, emailLimit })} />
              <TextField label="Webhook attempts" type="number" value={workerSettingsForm.webhookMaxAttempts} onChange={(webhookMaxAttempts) => setWorkerSettingsForm({ ...workerSettingsForm, webhookMaxAttempts })} />
              <TextField label="Email attempts" type="number" value={workerSettingsForm.emailMaxAttempts} onChange={(emailMaxAttempts) => setWorkerSettingsForm({ ...workerSettingsForm, emailMaxAttempts })} />
              <SelectField label="Webhook dry" value={workerSettingsForm.webhookDryRun} onChange={(webhookDryRun) => setWorkerSettingsForm({ ...workerSettingsForm, webhookDryRun })} options={['true', 'false']} />
              <SelectField label="Email dry" value={workerSettingsForm.emailDryRun} onChange={(emailDryRun) => setWorkerSettingsForm({ ...workerSettingsForm, emailDryRun })} options={['true', 'false']} />
            </div>
            <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={saveWorkerSettings} type="button"><FiCheck />Save worker settings</button>
          </div>
          <div className="stack nested-form">
            <RecordSelect label="Webhook delivery" records={webhookDeliveries} value={webhookDeliveryId} onChange={setWebhookDeliveryId} />
            <RecordSelect label="Email delivery" records={emailDeliveries} value={emailDeliveryId} onChange={setEmailDeliveryId} />
            <div className="button-row wrap">
              <button className="secondary-button" disabled={action.pending || !webhookDeliveryId} onClick={() => webhookDeliveryCommand(context.services.automation.retryWebhookDelivery, 'Webhook delivery queued')} type="button">Retry webhook</button>
              <button className="icon-button danger" disabled={action.pending || !webhookDeliveryId} onClick={() => webhookDeliveryCommand(context.services.automation.cancelWebhookDelivery, 'Webhook delivery canceled')} title="Cancel webhook delivery" type="button"><FiX /></button>
              <button className="secondary-button" disabled={action.pending || !emailDeliveryId} onClick={() => emailDeliveryCommand(context.services.automation.retryEmailDelivery, 'Email delivery queued')} type="button">Retry email</button>
              <button className="icon-button danger" disabled={action.pending || !emailDeliveryId} onClick={() => emailDeliveryCommand(context.services.automation.cancelEmailDelivery, 'Email delivery canceled')} title="Cancel email delivery" type="button"><FiX /></button>
            </div>
          </div>
        </div>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          <button className="secondary-button" disabled={action.pending || !ruleId} onClick={loadRuleJobs} type="button">Rule jobs</button>
          <RecordSelect label="Webhook" records={webhooks} value={webhookId} onChange={setWebhookId} />
          <button className="secondary-button" disabled={action.pending || !webhookId} onClick={loadWebhookDeliveries} type="button">Deliveries</button>
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadEmailDeliveries} type="button">Emails</button>
        </div>
        <ErrorLine message={action.error} />
        <div className="data-columns">
          <JsonPreview title="Notifications" value={notifications} />
          <JsonPreview title="Preferences" value={preferences} />
          <JsonPreview title="Defaults" value={defaultPreferences} />
          <JsonPreview title="Worker Settings" value={workerSettings} />
          <JsonPreview title="Webhooks" value={webhooks} />
          <JsonPreview title="Deliveries" value={webhookDeliveries} />
          <JsonPreview title="Emails" value={emailDeliveries} />
          <JsonPreview title="Rules" value={rules} />
          <JsonPreview title="Jobs" value={jobs} />
          <JsonPreview title="Run Result" value={runResult} />
        </div>
      </Panel>
    </div>
  );
};

const ImportsPage = ({ context }) => {
  const [jobs, setJobs] = useState([]);
  const [importJobId, setImportJobId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [mappingTemplateId, setMappingTemplateId] = useState('');
  const [records, setRecords] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [materializeResult, setMaterializeResult] = useState(null);
  const [jobForm, setJobForm] = useState({ provider: 'csv', configText: JSON.stringify({ targetProjectId: '' }, null, 2) });
  const [templateForm, setTemplateForm] = useState({
    name: 'Default work item mapping',
    provider: 'csv',
    sourceType: 'row',
    workItemTypeKey: 'story',
    fieldMappingText: JSON.stringify({ title: ['title', 'summary', 'fields.summary', 'Name'], descriptionMarkdown: ['description', 'fields.description', 'Description'] }, null, 2),
    defaultsText: JSON.stringify({ descriptionMarkdown: 'Imported through Trasck' }, null, 2),
    enabled: 'true',
  });
  const [parseForm, setParseForm] = useState({
    sourceType: '',
    content: 'key,title,type\nTRASCK-1,Imported story,story',
  });
  const [materializeForm, setMaterializeForm] = useState({ limit: '25', updateExisting: 'false' });
  const [recordForm, setRecordForm] = useState({ sourceType: 'issue', sourceId: 'MANUAL-1', targetType: 'work_item', targetId: '', rawPayloadText: '{}' });
  const action = useApiAction(context.addToast);

  const load = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const result = await action.run(async () => {
      const [jobRows, templateRows] = await Promise.all([
        context.services.imports.listJobs(context.workspaceId),
        context.services.imports.listMappingTemplates(context.workspaceId),
      ]);
      const nextJobId = importJobId || firstId(jobRows);
      const nextTemplateId = mappingTemplateId || firstId(templateRows);
      const [job, recordRows] = await Promise.all([
        nextJobId ? context.services.imports.getJob(nextJobId) : Promise.resolve(null),
        nextJobId ? context.services.imports.listRecords(nextJobId) : Promise.resolve([]),
      ]);
      return { jobRows, templateRows, nextJobId, nextTemplateId, job, recordRows };
    });
    if (result) {
      setJobs(result.jobRows || []);
      setTemplates(result.templateRows || []);
      setImportJobId(result.nextJobId || '');
      setMappingTemplateId(result.nextTemplateId || '');
      setSelectedJob(result.job || null);
      setRecords(result.recordRows || []);
    }
  };

  const createJob = async (event) => {
    event.preventDefault();
    const job = await action.run(() => context.services.imports.createJob(context.workspaceId, {
      provider: jobForm.provider,
      config: {
        ...parseJsonOrThrow(jobForm.configText),
        targetProjectId: context.projectId || parseJson(jobForm.configText, {}).targetProjectId,
      },
    }), 'Import job created');
    if (job) {
      setImportJobId(job.id || '');
      await load();
    }
  };

  const createTemplate = async (event) => {
    event.preventDefault();
    const template = await action.run(() => context.services.imports.createMappingTemplate(context.workspaceId, {
      name: templateForm.name,
      provider: templateForm.provider,
      sourceType: templateForm.sourceType || undefined,
      targetType: 'work_item',
      projectId: context.projectId || undefined,
      workItemTypeKey: templateForm.workItemTypeKey,
      fieldMapping: parseJsonOrThrow(templateForm.fieldMappingText),
      defaults: parseJsonOrThrow(templateForm.defaultsText),
      enabled: templateForm.enabled === 'true',
    }), 'Mapping template created');
    if (template) {
      setMappingTemplateId(template.id || '');
      await load();
    }
  };

  const parseJob = async (event) => {
    event.preventDefault();
    const parsed = await action.run(() => context.services.imports.parse(importJobId, {
      content: parseForm.content,
      sourceType: parseForm.sourceType || undefined,
    }), 'Import parsed');
    if (parsed) {
      setParseResult(parsed);
      await loadRecords();
    }
  };

  const materializeJob = async (event) => {
    event.preventDefault();
    const result = await action.run(() => context.services.imports.materialize(importJobId, {
      mappingTemplateId,
      projectId: context.projectId || undefined,
      limit: numberOrUndefined(materializeForm.limit),
      updateExisting: materializeForm.updateExisting === 'true',
    }), 'Import materialized');
    if (result) {
      setMaterializeResult(result);
      await loadRecords();
    }
  };

  const createRecord = async (event) => {
    event.preventDefault();
    await action.run(() => context.services.imports.createRecord(importJobId, {
      sourceType: recordForm.sourceType,
      sourceId: recordForm.sourceId,
      targetType: recordForm.targetType || undefined,
      targetId: recordForm.targetId || undefined,
      rawPayload: parseJsonOrThrow(recordForm.rawPayloadText),
    }), 'Record created');
    await loadRecords();
  };

  const loadRecords = async () => {
    if (!importJobId) {
      action.setError('Import job is required');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.imports.getJob(importJobId),
      context.services.imports.listRecords(importJobId),
    ]));
    if (result) {
      const [job, rows] = result;
      setSelectedJob(job || null);
      setRecords(rows || []);
    }
  };

  const jobCommand = async (command, success) => {
    await action.run(() => command(importJobId), success);
    await loadRecords();
  };

  return (
    <div className="content-grid">
      <Panel title="Import Job" icon={<FiUploadCloud />}>
        <form className="stack" onSubmit={createJob}>
          <SelectField label="Provider" value={jobForm.provider} onChange={(provider) => setJobForm({ ...jobForm, provider })} options={['csv', 'jira', 'rally']} />
          <Field label="Config JSON">
            <textarea value={jobForm.configText} onChange={(event) => setJobForm({ ...jobForm, configText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create job</button>
        </form>
      </Panel>
      <Panel title="Parse" icon={<FiDatabase />}>
        <form className="stack" onSubmit={parseJob}>
          <RecordSelect label="Import job" records={jobs} value={importJobId} onChange={setImportJobId} />
          <TextField label="Source type" value={parseForm.sourceType} onChange={(sourceType) => setParseForm({ ...parseForm, sourceType })} />
          <Field label="Content">
            <textarea value={parseForm.content} onChange={(event) => setParseForm({ ...parseForm, content: event.target.value })} rows={8} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !importJobId} type="submit"><FiRefreshCw />Parse</button>
        </form>
      </Panel>
      <Panel title="Mapping Template" icon={<FiSliders />}>
        <form className="stack" onSubmit={createTemplate}>
          <TextField label="Name" value={templateForm.name} onChange={(name) => setTemplateForm({ ...templateForm, name })} />
          <div className="two-column compact">
            <SelectField label="Provider" value={templateForm.provider} onChange={(provider) => setTemplateForm({ ...templateForm, provider })} options={['csv', 'jira', 'rally']} />
            <TextField label="Source type" value={templateForm.sourceType} onChange={(sourceType) => setTemplateForm({ ...templateForm, sourceType })} />
            <TextField label="Type key" value={templateForm.workItemTypeKey} onChange={(workItemTypeKey) => setTemplateForm({ ...templateForm, workItemTypeKey })} />
            <SelectField label="Enabled" value={templateForm.enabled} onChange={(enabled) => setTemplateForm({ ...templateForm, enabled })} options={['true', 'false']} />
          </div>
          <Field label="Field mapping JSON">
            <textarea value={templateForm.fieldMappingText} onChange={(event) => setTemplateForm({ ...templateForm, fieldMappingText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <Field label="Defaults JSON">
            <textarea value={templateForm.defaultsText} onChange={(event) => setTemplateForm({ ...templateForm, defaultsText: event.target.value })} rows={4} spellCheck="false" />
          </Field>
          <button className="primary-button" disabled={action.pending || !context.workspaceId || !context.projectId} type="submit"><FiPlus />Create template</button>
        </form>
      </Panel>
      <Panel title="Materialize" icon={<FiArrowRight />}>
        <form className="stack" onSubmit={materializeJob}>
          <RecordSelect label="Import job" records={jobs} value={importJobId} onChange={setImportJobId} />
          <RecordSelect label="Template" records={templates} value={mappingTemplateId} onChange={setMappingTemplateId} />
          <div className="two-column compact">
            <TextField label="Limit" type="number" value={materializeForm.limit} onChange={(limit) => setMaterializeForm({ ...materializeForm, limit })} />
            <SelectField label="Update existing" value={materializeForm.updateExisting} onChange={(updateExisting) => setMaterializeForm({ ...materializeForm, updateExisting })} options={['false', 'true']} />
          </div>
          <button className="primary-button" disabled={action.pending || !importJobId || !mappingTemplateId || !context.projectId} type="submit"><FiArrowRight />Materialize</button>
        </form>
      </Panel>
      <Panel title="Manual Record" icon={<FiPlus />}>
        <form className="stack" onSubmit={createRecord}>
          <RecordSelect label="Import job" records={jobs} value={importJobId} onChange={setImportJobId} />
          <TextField label="Source type" value={recordForm.sourceType} onChange={(sourceType) => setRecordForm({ ...recordForm, sourceType })} />
          <TextField label="Source ID" value={recordForm.sourceId} onChange={(sourceId) => setRecordForm({ ...recordForm, sourceId })} />
          <TextField label="Target type" value={recordForm.targetType} onChange={(targetType) => setRecordForm({ ...recordForm, targetType })} />
          <TextField label="Target ID" value={recordForm.targetId} onChange={(targetId) => setRecordForm({ ...recordForm, targetId })} />
          <button className="primary-button" disabled={action.pending || !importJobId} type="submit"><FiPlus />Add record</button>
        </form>
      </Panel>
      <Panel title="Lifecycle" icon={<FiActivity />}>
        <RecordSelect label="Import job" records={jobs} value={importJobId} onChange={setImportJobId} />
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Load</button>
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.start, 'Import started')} type="button">Start</button>
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.complete, 'Import completed')} type="button">Complete</button>
          <button className="secondary-button" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.fail, 'Import failed')} type="button">Fail</button>
          <button className="icon-button danger" disabled={action.pending || !importJobId} onClick={() => jobCommand(context.services.imports.cancel, 'Import canceled')} title="Cancel import" type="button"><FiX /></button>
        </div>
      </Panel>
      <Panel title="Import Records" icon={<FiEye />} wide>
        <ErrorLine message={action.error} />
        <div className="data-columns">
          <JsonPreview title="Jobs" value={jobs} />
          <JsonPreview title="Templates" value={templates} />
          <JsonPreview title="Selected Job" value={selectedJob} />
          <JsonPreview title="Parse Result" value={parseResult} />
          <JsonPreview title="Materialize Result" value={materializeResult} />
          <JsonPreview title="Records" value={records} />
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
          <RecordSelect label="Saved filter" records={filters} value={context.savedFilterId} onChange={context.setSavedFilterId} />
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
      if (!context.dashboardId && firstId(rows)) {
        context.setDashboardId(firstId(rows));
      }
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
          <RecordSelect label="Dashboard" records={dashboards} value={context.dashboardId} onChange={context.setDashboardId} />
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

const RecordSelect = ({ includeBlank = false, label, onChange, records, value }) => (
  <Field label={label}>
    <select value={value || ''} onChange={(event) => onChange(event.target.value)}>
      {includeBlank && <option value="">None</option>}
      {!includeBlank && !value && <option value="">Select</option>}
      {records.map((record) => (
        <option key={record.id} value={record.id}>{recordLabel(record)}</option>
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

const firstId = (records) => Array.isArray(records) && records.length > 0 ? records[0].id || '' : '';

const numberOrUndefined = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return undefined;
  }
  return Number(value);
};

const settingsToForm = (settings) => ({
  automationJobsEnabled: String(Boolean(settings.automationJobsEnabled)),
  webhookDeliveriesEnabled: String(Boolean(settings.webhookDeliveriesEnabled)),
  emailDeliveriesEnabled: String(Boolean(settings.emailDeliveriesEnabled)),
  automationLimit: String(settings.automationLimit ?? 25),
  webhookLimit: String(settings.webhookLimit ?? 25),
  emailLimit: String(settings.emailLimit ?? 25),
  webhookMaxAttempts: String(settings.webhookMaxAttempts ?? 3),
  emailMaxAttempts: String(settings.emailMaxAttempts ?? 3),
  webhookDryRun: String(settings.webhookDryRun ?? true),
  emailDryRun: String(settings.emailDryRun ?? true),
});

const recordLabel = (record) => {
  const prefix = record.key || record.version || record.provider || record.channel || record.eventType || record.recipientEmail || '';
  const name = record.name || record.title || record.displayName || record.username || record.sourceId || record.status || record.subject || '';
  const label = [prefix, name].filter(Boolean).join(' - ');
  return label || record.id;
};

export default App;
