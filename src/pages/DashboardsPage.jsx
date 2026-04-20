import { useState } from 'react';
import { FiActivity, FiBarChart2, FiEye, FiPlus, FiRefreshCw } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { Field } from '../components/Field';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { RecordSelect } from '../components/RecordSelect';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';

export const DashboardsPage = ({ context }) => {
  const [dashboards, setDashboards] = useState([]);
  const [rendered, setRendered] = useState(null);
  const [projectSummary, setProjectSummary] = useState(null);
  const [workspaceSummary, setWorkspaceSummary] = useState(null);
  const [projectImportCompletions, setProjectImportCompletions] = useState(null);
  const [workspaceImportCompletions, setWorkspaceImportCompletions] = useState(null);
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
  const [reportForm, setReportForm] = useState({
    from: '2020-01-01T00:00:00Z',
    to: '2030-01-01T00:00:00Z',
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

  const loadImportReports = async () => {
    if (!context.workspaceId) {
      action.setError('Workspace ID is required');
      return;
    }
    const query = {
      from: reportForm.from || undefined,
      to: reportForm.to || undefined,
    };
    const result = await action.run(() => Promise.all([
      context.projectId ? context.services.dashboards.projectSummary(context.projectId, query) : Promise.resolve(null),
      context.services.dashboards.workspaceSummary(context.workspaceId, query),
      context.projectId ? context.services.dashboards.projectImportCompletions(context.projectId, query) : Promise.resolve(null),
      context.services.dashboards.workspaceImportCompletions(context.workspaceId, query),
    ]));
    if (result) {
      const [nextProjectSummary, nextWorkspaceSummary, nextProjectImportCompletions, nextWorkspaceImportCompletions] = result;
      setProjectSummary(nextProjectSummary);
      setWorkspaceSummary(nextWorkspaceSummary);
      setProjectImportCompletions(nextProjectImportCompletions);
      setWorkspaceImportCompletions(nextWorkspaceImportCompletions);
    }
  };

  const useImportWidgetTemplate = (widgetType, title, config) => {
    setWidgetForm((current) => ({
      ...current,
      widgetType,
      title,
      configText: JSON.stringify(config, null, 2),
    }));
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
          <div className="button-row wrap">
            <button className="secondary-button" onClick={() => useImportWidgetTemplate('import_completion_summary', 'Import Completion Summary', { reportType: 'project_dashboard_summary', query: { projectId: context.projectId || '' } })} type="button"><FiBarChart2 />Project import</button>
            <button className="secondary-button" onClick={() => useImportWidgetTemplate('portfolio_import_completion_summary', 'Portfolio Import Completion Summary', { reportType: 'workspace_dashboard_summary', query: {} })} type="button"><FiBarChart2 />Workspace import</button>
          </div>
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
      <Panel title="Import Reports" icon={<FiBarChart2 />} wide>
        <div className="data-columns two no-margin">
          <TextField label="From" value={reportForm.from} onChange={(from) => setReportForm({ ...reportForm, from })} />
          <TextField label="To" value={reportForm.to} onChange={(to) => setReportForm({ ...reportForm, to })} />
        </div>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadImportReports} type="button"><FiRefreshCw />Load import reports</button>
        </div>
        <div className="data-columns two">
          <JsonPreview title="Project Summary" value={projectSummary} />
          <JsonPreview title="Workspace Summary" value={workspaceSummary} />
          <JsonPreview title="Project Import Completions" value={projectImportCompletions} />
          <JsonPreview title="Workspace Import Completions" value={workspaceImportCompletions} />
        </div>
      </Panel>
    </div>
  );
};
