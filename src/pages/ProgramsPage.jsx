import { useEffect, useState } from 'react';
import { FiArchive, FiBarChart2, FiBriefcase, FiPlus, FiRefreshCw, FiSave, FiTrash2 } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { Field } from '../components/Field';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { RecordSelect } from '../components/RecordSelect';
import { SelectField } from '../components/SelectField';
import { SummaryRows } from '../components/SummaryRows';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';
import { numberOrUndefined, parseJsonOrThrow, toJsonText } from '../utils/forms';

const defaultProgramForm = () => ({
  name: 'Customer Delivery Program',
  description: 'Cross-project program for portfolio planning.',
  status: 'active',
  roadmapConfigText: toJsonText({ view: 'timeline', horizon: 'quarter' }),
  reportConfigText: toJsonText({ defaultWindow: 'current_quarter', showImportCompletion: true }),
});

const programToForm = (program) => ({
  name: program?.name || '',
  description: program?.description || '',
  status: program?.status || 'active',
  roadmapConfigText: toJsonText(program?.roadmapConfig),
  reportConfigText: toJsonText(program?.reportConfig),
});

export const ProgramsPage = ({ context }) => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programProjects, setProgramProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [programForm, setProgramForm] = useState(defaultProgramForm);
  const [assignmentForm, setAssignmentForm] = useState({ projectId: context.projectId || '', position: '1' });
  const [reportForm, setReportForm] = useState({ from: '2020-01-01T00:00:00Z', to: '2030-01-01T00:00:00Z' });
  const action = useApiAction(context.addToast);

  useEffect(() => {
    setAssignmentForm((current) => ({ ...current, projectId: current.projectId || context.projectId || '' }));
  }, [context.projectId]);

  const programPayload = () => ({
    name: programForm.name,
    description: programForm.description,
    status: programForm.status,
    roadmapConfig: parseJsonObject(programForm.roadmapConfigText, 'Roadmap config'),
    reportConfig: parseJsonObject(programForm.reportConfigText, 'Report config'),
  });

  const loadPrograms = async (preferredProgramId = selectedProgramId) => {
    if (!context.workspaceId) {
      action.setError('Select a workspace before loading programs');
      return;
    }
    const rows = await action.run(() => context.services.programs.list(context.workspaceId));
    if (rows) {
      setPrograms(rows || []);
      const nextProgramId = rows.find((program) => program.id === preferredProgramId)?.id || rows?.[0]?.id || '';
      setSelectedProgramId(nextProgramId);
      if (nextProgramId) {
        await loadProgram(nextProgramId);
      } else {
        setSelectedProgram(null);
        setProgramProjects([]);
        setSummary(null);
      }
    }
  };

  const loadProgram = async (programId = selectedProgramId) => {
    if (!programId) {
      action.setError('Select a program first');
      return;
    }
    const result = await action.run(() => Promise.all([
      context.services.programs.get(programId),
      context.services.programs.listProjects(programId),
    ]));
    if (result) {
      const [program, projects] = result;
      setSelectedProgram(program);
      setSelectedProgramId(program?.id || programId);
      setProgramProjects(projects || program?.projects || []);
      setProgramForm(programToForm(program));
    }
  };

  const createProgram = async (event) => {
    event.preventDefault();
    if (!context.workspaceId) {
      action.setError('Select a workspace before creating programs');
      return;
    }
    const created = await action.run(
      () => context.services.programs.create(context.workspaceId, programPayload()),
      'Program created',
    );
    if (created) {
      setSelectedProgramId(created.id || '');
      await loadPrograms(created.id || '');
    }
  };

  const updateProgram = async (event) => {
    event.preventDefault();
    if (!selectedProgramId) {
      action.setError('Select a program first');
      return;
    }
    const updated = await action.run(
      () => context.services.programs.update(selectedProgramId, programPayload()),
      'Program saved',
    );
    if (updated) {
      setSelectedProgram(updated);
      setProgramForm(programToForm(updated));
      await loadPrograms();
    }
  };

  const archiveProgram = async () => {
    if (!selectedProgramId) {
      action.setError('Select a program first');
      return;
    }
    if (!window.confirm('Archive this program?')) {
      return;
    }
    await action.run(() => context.services.programs.archive(selectedProgramId), 'Program archived');
    setSelectedProgram(null);
    setSelectedProgramId('');
    setProgramProjects([]);
    setSummary(null);
    await loadPrograms();
  };

  const assignProject = async (event) => {
    event.preventDefault();
    if (!selectedProgramId || !assignmentForm.projectId) {
      action.setError('Select a program and project first');
      return;
    }
    await action.run(
      () => context.services.programs.assignProject(selectedProgramId, assignmentForm.projectId, {
        position: numberOrUndefined(assignmentForm.position),
      }),
      'Project assigned',
    );
    await loadProgram(selectedProgramId);
  };

  const removeProject = async (projectId) => {
    if (!selectedProgramId || !projectId) {
      return;
    }
    if (!window.confirm('Remove this project from the program?')) {
      return;
    }
    await action.run(() => context.services.programs.removeProject(selectedProgramId, projectId), 'Project removed');
    await loadProgram(selectedProgramId);
  };

  const loadSummary = async () => {
    if (!selectedProgramId) {
      action.setError('Select a program first');
      return;
    }
    const loaded = await action.run(() => context.services.programs.dashboardSummary(selectedProgramId, {
      from: reportForm.from || undefined,
      to: reportForm.to || undefined,
    }));
    if (loaded) {
      setSummary(loaded);
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Program Portfolio" icon={<FiBriefcase />}>
        <form className="stack" onSubmit={createProgram}>
          <TextField label="Name" value={programForm.name} onChange={(name) => setProgramForm({ ...programForm, name })} />
          <TextField label="Description" value={programForm.description} onChange={(description) => setProgramForm({ ...programForm, description })} />
          <SelectField label="Status" value={programForm.status} onChange={(status) => setProgramForm({ ...programForm, status })} options={['active', 'archived']} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create program</button>
        </form>
        <div className="stack">
          <RecordSelect label="Program" records={programs} value={selectedProgramId} onChange={(programId) => { setSelectedProgramId(programId); loadProgram(programId); }} />
          <div className="button-row wrap">
            <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadPrograms} type="button"><FiRefreshCw />Refresh</button>
            <button className="secondary-button" disabled={action.pending || !selectedProgramId} onClick={() => loadProgram()} type="button"><FiRefreshCw />Refresh detail</button>
          </div>
          <ErrorLine message={action.error} />
        </div>
      </Panel>

      <Panel title="Program Detail" icon={<FiSave />}>
        <form className="stack" onSubmit={updateProgram}>
          <SummaryRows rows={[
            ['Selected', selectedProgram?.name || 'None'],
            ['Created', selectedProgram?.createdAt],
            ['Updated', selectedProgram?.updatedAt],
          ]} />
          <TextField label="Name" value={programForm.name} onChange={(name) => setProgramForm({ ...programForm, name })} />
          <TextField label="Description" value={programForm.description} onChange={(description) => setProgramForm({ ...programForm, description })} />
          <SelectField label="Status" value={programForm.status} onChange={(status) => setProgramForm({ ...programForm, status })} options={['active', 'archived']} />
          <Field label="Roadmap config JSON">
            <textarea value={programForm.roadmapConfigText} onChange={(event) => setProgramForm({ ...programForm, roadmapConfigText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <Field label="Report config JSON">
            <textarea value={programForm.reportConfigText} onChange={(event) => setProgramForm({ ...programForm, reportConfigText: event.target.value })} rows={6} spellCheck="false" />
          </Field>
          <div className="button-row wrap">
            <button className="primary-button" disabled={action.pending || !selectedProgramId} type="submit"><FiSave />Save</button>
            <button className="secondary-button danger" disabled={action.pending || !selectedProgramId} onClick={archiveProgram} type="button"><FiArchive />Archive</button>
          </div>
        </form>
      </Panel>

      <Panel title="Program Projects" icon={<FiBriefcase />} wide>
        <form className="stack compact" onSubmit={assignProject}>
          <div className="two-column compact">
            <RecordSelect
              label="Project"
              records={context.projectOptions.filter((project) => project.workspaceId === context.workspaceId)}
              value={assignmentForm.projectId}
              onChange={(projectId) => setAssignmentForm({ ...assignmentForm, projectId })}
            />
            <TextField label="Position" type="number" value={assignmentForm.position} onChange={(position) => setAssignmentForm({ ...assignmentForm, position })} />
          </div>
          <button className="secondary-button" disabled={action.pending || !selectedProgramId || !assignmentForm.projectId} type="submit"><FiPlus />Assign project</button>
        </form>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Position</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {programProjects.map((project) => (
                <tr key={project.projectId}>
                  <td>{projectName(context.projectOptions, project.projectId)}</td>
                  <td>{project.position}</td>
                  <td>{project.createdAt || 'None'}</td>
                  <td>
                    <button className="secondary-button" disabled={action.pending} onClick={() => removeProject(project.projectId)} type="button"><FiTrash2 />Remove</button>
                  </td>
                </tr>
              ))}
              {programProjects.length === 0 && (
                <tr>
                  <td colSpan="4">No program projects loaded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Program Summary" icon={<FiBarChart2 />} wide>
        <div className="data-columns two no-margin">
          <TextField label="From" value={reportForm.from} onChange={(from) => setReportForm({ ...reportForm, from })} />
          <TextField label="To" value={reportForm.to} onChange={(to) => setReportForm({ ...reportForm, to })} />
        </div>
        <div className="button-row wrap">
          <button className="secondary-button" disabled={action.pending || !selectedProgramId} onClick={loadSummary} type="button"><FiRefreshCw />Refresh summary</button>
        </div>
        <div className="data-columns two">
          <SummaryRows rows={[
            ['Scope', summary?.scope?.scopeType],
            ['Program', selectedProgram?.name || summary?.scope?.programId],
            ['Projects', String(summary?.scope?.projectIds?.length ?? 0)],
            ['Total work items', String(summary?.totals?.workItems ?? summary?.totalWorkItems ?? 0)],
          ]} />
          <JsonPreview title="Summary" value={summary} />
        </div>
      </Panel>
    </div>
  );
};

const parseJsonObject = (value, label) => {
  const parsed = parseJsonOrThrow(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return parsed;
};

const projectName = (projects, projectId) => {
  const project = projects.find((candidate) => candidate.id === projectId);
  return project ? `${project.key} - ${project.name}` : 'Project';
};
