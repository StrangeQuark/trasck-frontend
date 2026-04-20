import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DEFAULT_API_BASE_URL, createTrasckApiClient } from './api/client';
import { createAgentsService } from './api/services/agentsService';
import { createAuthService } from './api/services/authService';
import { createAutomationService } from './api/services/automationService';
import { createConfigurationService } from './api/services/configurationService';
import { createDashboardsService } from './api/services/dashboardsService';
import { createImportsService } from './api/services/importsService';
import { createPlanningService } from './api/services/planningService';
import { createSearchService } from './api/services/searchService';
import { createWorkItemsService } from './api/services/workItemsService';
import { Shell } from './app/Shell';
import { ToastStack } from './components/ToastStack';
import { useLocalStorage } from './hooks/useLocalStorage';
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
import { PlanningPage } from './pages/planning/PlanningPage';
import { SearchPage } from './pages/SearchPage';
import { SetupPage } from './pages/SetupPage';
import { TokenAdminPage } from './pages/TokenAdminPage';
import { WorkPage } from './pages/WorkPage';
import './styles/app.css';

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
            <Route path="/planning/boards/:boardId" element={<BoardDetailPage context={context} />} />
            <Route path="/planning/releases/:releaseId" element={<ReleaseDetailPage context={context} />} />
            <Route path="/planning/roadmaps/:roadmapId" element={<RoadmapDetailPage context={context} />} />
            <Route path="/configuration" element={<ConfigurationPage context={context} />} />
            <Route path="/configuration/custom-fields/:customFieldId" element={<CustomFieldDetailPage context={context} />} />
            <Route path="/configuration/screens/:screenId" element={<ScreenDetailPage context={context} />} />
            <Route path="/automation" element={<AutomationPage context={context} />} />
            <Route path="/automation/rules/:ruleId" element={<AutomationRuleDetailPage context={context} />} />
            <Route path="/automation/webhooks/:webhookId" element={<WebhookDetailPage context={context} />} />
            <Route path="/imports" element={<ImportsPage context={context} />} />
            <Route path="/imports/jobs/:importJobId" element={<ImportJobDetailPage context={context} />} />
            <Route path="/imports/templates/:mappingTemplateId" element={<ImportTemplateDetailPage context={context} />} />
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

export default App;
