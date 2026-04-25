import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { createTrasckApiClient } from './api/client';
import { createAgentsService } from './api/services/agentsService';
import { createAuthService } from './api/services/authService';
import { createAutomationService } from './api/services/automationService';
import { createConfigurationService } from './api/services/configurationService';
import { createDashboardsService } from './api/services/dashboardsService';
import { createImportsService } from './api/services/importsService';
import { createPlanningService } from './api/services/planningService';
import { createProgramsService } from './api/services/programsService';
import { createSearchService } from './api/services/searchService';
import { createSecurityService } from './api/services/securityService';
import { createWorkItemsService } from './api/services/workItemsService';
import { Shell } from './app/Shell';
import { RouteAccessGate } from './components/RouteAccessGate';
import { ToastStack } from './components/ToastStack';
import { AgentsPage } from './pages/AgentsPage';
import { AuthPage } from './pages/AuthPage';
import { AutomationRuleDetailPage, WebhookDetailPage } from './pages/automation/AutomationDetailPages';
import { AutomationPage } from './pages/automation/AutomationPage';
import { ConfigurationPage } from './pages/configuration/ConfigurationPage';
import { CustomFieldDetailPage, ScreenDetailPage } from './pages/configuration/ConfigurationDetailPages';
import { DashboardsPage } from './pages/DashboardsPage';
import { ImportJobDetailPage, ImportTemplateDetailPage } from './pages/imports/ImportDetailPages';
import { ImportsPage } from './pages/imports/ImportsPage';
import { OverviewPage } from './pages/OverviewPage';
import { BoardDetailPage, ReleaseDetailPage, RoadmapDetailPage } from './pages/planning/PlanningDetailPages';
import { PlanningBacklogPage } from './pages/planning/PlanningBacklogPage';
import { PlanningAdminPage } from './pages/planning/PlanningAdminPage';
import { PlanningPage } from './pages/planning/PlanningPage';
import { PlanningSprintBoardPage } from './pages/planning/PlanningSprintBoardPage';
import { ProjectSettingsPage } from './pages/ProjectSettingsPage';
import { ProgramsPage } from './pages/ProgramsPage';
import { PublicProjectPreviewPage } from './pages/PublicProjectPreviewPage';
import { SearchPage } from './pages/SearchPage';
import { SetupPage } from './pages/SetupPage';
import { SystemAdminPage } from './pages/SystemAdminPage';
import { TokenAdminPage } from './pages/TokenAdminPage';
import { WorkPage } from './pages/WorkPage';
import { WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage';
import { hasAnyPermissionKey, hasPermissionKey, projectPermissionKeys, workspacePermissionKeys } from './utils/permissions';
import './styles/app.css';

const App = () => {
  const [workspaceId, setWorkspaceId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [workspaceOptions, setWorkspaceOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [sessionContext, setSessionContext] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, tone = 'info') => {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 5200);
  };

  const api = useMemo(() => createTrasckApiClient(), []);
  const services = useMemo(() => ({
    agents: createAgentsService(api),
    auth: createAuthService(api),
    automation: createAutomationService(api),
    configuration: createConfigurationService(api),
    dashboards: createDashboardsService(api),
    imports: createImportsService(api),
    planning: createPlanningService(api),
    programs: createProgramsService(api),
    search: createSearchService(api),
    security: createSecurityService(api),
    workItems: createWorkItemsService(api),
  }), [api]);

  const applySessionContext = (loadedContext) => {
    const nextWorkspaces = loadedContext?.workspaces || [];
    const nextProjects = loadedContext?.projects || [];
    const defaultWorkspaceId = loadedContext?.defaultWorkspace?.id || nextWorkspaces[0]?.id || '';
    const defaultProjectId = loadedContext?.defaultProject?.id || nextProjects.find((project) => project.workspaceId === defaultWorkspaceId)?.id || nextProjects[0]?.id || '';

    setSessionContext(loadedContext || null);
    setCurrentUser(loadedContext?.user || null);
    setWorkspaceOptions(nextWorkspaces);
    setProjectOptions(nextProjects);
    setWorkspaceId((current) => nextWorkspaces.some((workspace) => workspace.id === current) ? current : defaultWorkspaceId);
    setProjectId((current) => nextProjects.some((project) => project.id === current) ? current : defaultProjectId);
  };

  const clearSessionContext = () => {
    setSessionContext(null);
    setCurrentUser(null);
    setWorkspaceOptions([]);
    setProjectOptions([]);
    setWorkspaceId('');
    setProjectId('');
  };

  const refreshSession = async () => {
    const loadedContext = await services.auth.context();
    applySessionContext(loadedContext);
    return loadedContext;
  };

  const refreshSetupStatus = async () => {
    const status = await services.auth.setupStatus();
    setSetupAvailable(Boolean(status?.available));
    return status;
  };

  const selectWorkspace = (nextWorkspaceId) => {
    setWorkspaceId(nextWorkspaceId);
    const nextProject = projectOptions.find((project) => project.workspaceId === nextWorkspaceId);
    setProjectId(nextProject?.id || '');
  };

  useEffect(() => {
    let cancelled = false;
    services.auth.context()
      .then((loadedContext) => {
        if (!cancelled) {
          applySessionContext(loadedContext);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSessionContext();
        }
      });
    services.auth.setupStatus()
      .then((status) => {
        if (!cancelled) {
          setSetupAvailable(Boolean(status?.available));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSetupAvailable(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [services]);

  const context = {
    hasAnyProjectPermission: (permissionKeys) => hasAnyPermissionKey(projectPermissionKeys({
      projectId,
      projectOptions,
      workspaceId,
      workspaceOptions,
    }), permissionKeys),
    hasAnyWorkspacePermission: (permissionKeys) => hasAnyPermissionKey(workspacePermissionKeys({
      projectId,
      projectOptions,
      workspaceId,
      workspaceOptions,
    }), permissionKeys),
    hasProjectPermission: (permissionKey) => hasPermissionKey(projectPermissionKeys({
      projectId,
      projectOptions,
      workspaceId,
      workspaceOptions,
    }), permissionKey),
    hasWorkspacePermission: (permissionKey) => hasPermissionKey(workspacePermissionKeys({
      projectId,
      projectOptions,
      workspaceId,
      workspaceOptions,
    }), permissionKey),
    addToast,
    applySessionContext,
    clearSessionContext,
    currentUser,
    projectId,
    projectOptions,
    refreshSetupStatus,
    refreshSession,
    services,
    setCurrentUser,
    setProjectId,
    setupAvailable,
    setSetupAvailable,
    selectWorkspace,
    sessionContext,
    setWorkspaceId,
    systemAdmin: Boolean(sessionContext?.systemAdmin),
    workspaceId,
    workspaceOptions,
  };

  return (
    <BrowserRouter>
      <main className="app-shell">
        <Shell context={context}>
          <Routes>
            <Route path="/" element={<OverviewPage context={context} />} />
            <Route path="/setup" element={<SetupPage context={context} />} />
            <Route path="/auth" element={<AuthPage context={context} />} />
            <Route path="/work" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasProjectPermission('work_item.read')} message="Your current project membership cannot read work items.">
                <WorkPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/planning" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasAnyProjectPermission(['project.read', 'board.admin'])} message="Your current project membership cannot access planning.">
                <PlanningPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/planning/backlog" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasAnyProjectPermission(['project.read', 'work_item.read'])} message="Your current project membership cannot access the backlog.">
                <PlanningBacklogPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/planning/active-board" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasAnyProjectPermission(['project.read', 'work_item.read'])} message="Your current project membership cannot access the active board.">
                <PlanningSprintBoardPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/planning/admin" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasAnyProjectPermission(['project.read', 'board.admin'])} message="Your current project membership cannot access planning administration.">
                <PlanningAdminPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/programs" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('workspace.read')} message="Your current workspace membership cannot access programs.">
                <ProgramsPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/planning/boards/:boardId" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasAnyProjectPermission(['project.read', 'work_item.read'])} message="Your current project membership cannot access boards.">
                <BoardDetailPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/planning/releases/:releaseId" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasProjectPermission('project.read')} message="Your current project membership cannot access releases.">
                <ReleaseDetailPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/planning/roadmaps/:roadmapId" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && (context.hasWorkspacePermission('workspace.read') || context.hasProjectPermission('project.read'))} message="Your current membership cannot access roadmaps.">
                <RoadmapDetailPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/configuration" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('workspace.read')} message="Your current workspace membership cannot access configuration.">
                <ConfigurationPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/configuration/custom-fields/:customFieldId" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('workspace.read')} message="Your current workspace membership cannot access custom field details.">
                <CustomFieldDetailPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/configuration/screens/:screenId" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('workspace.read')} message="Your current workspace membership cannot access screen details.">
                <ScreenDetailPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/automation" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('automation.admin')} message="Your current workspace membership cannot access automation.">
                <AutomationPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/automation/rules/:ruleId" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('automation.admin')} message="Your current workspace membership cannot access automation rules.">
                <AutomationRuleDetailPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/automation/webhooks/:webhookId" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('automation.admin')} message="Your current workspace membership cannot access automation webhooks.">
                <WebhookDetailPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/imports" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('workspace.admin')} message="Your current workspace membership cannot access imports.">
                <ImportsPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/imports/jobs/:importJobId" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('workspace.admin')} message="Your current workspace membership cannot access import jobs.">
                <ImportJobDetailPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/imports/templates/:mappingTemplateId" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('workspace.admin')} message="Your current workspace membership cannot access import templates.">
                <ImportTemplateDetailPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/dashboards" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasWorkspacePermission('report.read')} message="Your current workspace membership cannot access dashboards.">
                <DashboardsPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/filters" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && (context.hasWorkspacePermission('workspace.read') || context.hasWorkspacePermission('report.read'))} message="Your current workspace membership cannot access saved filters and views.">
                <SearchPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/agents" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasAnyWorkspacePermission(['agent.provider.manage', 'agent.profile.manage', 'repository_connection.manage'])} message="Your current workspace membership cannot access agent administration.">
                <AgentsPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/tokens" element={<TokenAdminPage context={context} />} />
            <Route path="/system" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && Boolean(sessionContext?.systemAdmin)} message="Only system administrators can access this area.">
                <SystemAdminPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/workspace-settings" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasAnyWorkspacePermission(['workspace.admin', 'user.manage'])} message="Your current workspace membership cannot access workspace settings.">
                <WorkspaceSettingsPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/project-settings" element={(
              <RouteAccessGate allowed={Boolean(currentUser) && context.hasProjectPermission('project.admin')} message="Your current project membership cannot access project settings.">
                <ProjectSettingsPage context={context} />
              </RouteAccessGate>
            )} />
            <Route path="/public/projects/:projectId" element={<PublicProjectPreviewPage context={context} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
        <ToastStack items={toasts} onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))} />
      </main>
    </BrowserRouter>
  );
};

export default App;
