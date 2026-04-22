import { useState } from 'react';
import { FiActivity, FiBarChart2, FiCheck, FiEye, FiLayers, FiList, FiPlus, FiRefreshCw, FiSliders, FiUsers } from 'react-icons/fi';
import { DetailLinkGrid } from '../../components/DetailLinkGrid';
import { ErrorLine } from '../../components/ErrorLine';
import { JsonPreview } from '../../components/JsonPreview';
import { Panel } from '../../components/Panel';
import { RecordSelect } from '../../components/RecordSelect';
import { SelectField } from '../../components/SelectField';
import { TextField } from '../../components/TextField';
import { useApiAction } from '../../hooks/useApiAction';
import { csv, firstId, numberOrUndefined } from '../../utils/forms';

export const PlanningPage = ({ context }) => {
  const [teams, setTeams] = useState([]);
  const [projectTeams, setProjectTeams] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [boards, setBoards] = useState([]);
  const [boardId, setBoardId] = useState('');
  const [boardColumns, setBoardColumns] = useState([]);
  const [boardSwimlanes, setBoardSwimlanes] = useState([]);
  const [boardWorkItems, setBoardWorkItems] = useState(null);
  const [savedFilters, setSavedFilters] = useState([]);
  const [releases, setReleases] = useState([]);
  const [releaseId, setReleaseId] = useState('');
  const [releaseWorkItems, setReleaseWorkItems] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [roadmapId, setRoadmapId] = useState('');
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [teamForm, setTeamForm] = useState({ name: 'Delivery Team', description: '', defaultCapacity: '100', status: 'active' });
  const [projectTeamForm, setProjectTeamForm] = useState({ teamId: '', role: 'delivery' });
  const [iterationForm, setIterationForm] = useState({ name: 'Sprint 1', teamId: '', startDate: '2026-04-20', endDate: '2026-05-01', status: 'planned' });
  const [boardForm, setBoardForm] = useState({ name: 'Project Board', type: 'kanban', teamId: '', projectScoped: 'true' });
  const [columnForm, setColumnForm] = useState({ name: 'Ready', position: '1', wipLimit: '', doneColumn: 'false' });
  const [swimlaneForm, setSwimlaneForm] = useState({
    name: 'Assigned work',
    mode: 'simple',
    swimlaneType: 'assignee',
    savedFilterId: '',
    field: 'assigneeId',
    operator: 'is_not_null',
    value: '',
    position: '1',
    enabled: 'true',
  });
  const [releaseForm, setReleaseForm] = useState({ name: 'Release 1', version: '1.0.0', startDate: '2026-04-20', releaseDate: '2026-05-15', status: 'planned', description: '' });
  const [releaseItemForm, setReleaseItemForm] = useState({ workItemId: '' });
  const [roadmapForm, setRoadmapForm] = useState({ name: 'Product Roadmap', visibility: 'project', lanes: 'now, next, later' });
  const [roadmapItemForm, setRoadmapItemForm] = useState({ workItemId: '', startDate: '2026-04-20', endDate: '2026-05-15', position: '1', lane: 'now' });
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
        savedFilterRows,
      ] = await Promise.all([
        context.services.planning.listTeams(context.workspaceId),
        context.services.planning.listProjectTeams(context.projectId),
        context.services.planning.listIterations(context.projectId),
        context.services.planning.listBoards(context.projectId),
        context.services.planning.listReleases(context.projectId),
        context.services.planning.listProjectRoadmaps(context.projectId),
        context.services.workItems.listByProject(context.projectId, { limit: 50 }),
        context.services.search.listProjectSavedFilters(context.projectId),
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
        savedFilterRows,
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
      setSavedFilters(result.savedFilterRows || []);
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
      filterConfig: { projectScoped: boardForm.projectScoped === 'true' },
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
      statusIds: [],
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
      swimlaneType: swimlaneForm.mode === 'saved_filter' ? 'query' : swimlaneForm.swimlaneType,
      savedFilterId: swimlaneForm.mode === 'saved_filter' ? swimlaneForm.savedFilterId || undefined : undefined,
      query: swimlaneQuery(swimlaneForm),
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
      config: { lanes: csv(roadmapForm.lanes) },
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
      displayConfig: { lane: roadmapItemForm.lane || undefined },
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
          <TextField label="Team name" value={teamForm.name} onChange={(name) => setTeamForm({ ...teamForm, name })} />
          <TextField label="Team description" value={teamForm.description} onChange={(description) => setTeamForm({ ...teamForm, description })} />
          <TextField label="Team capacity" type="number" value={teamForm.defaultCapacity} onChange={(defaultCapacity) => setTeamForm({ ...teamForm, defaultCapacity })} />
          <SelectField label="Team status" value={teamForm.status} onChange={(status) => setTeamForm({ ...teamForm, status })} options={['active', 'inactive']} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit"><FiPlus />Create team</button>
        </form>
      </Panel>
      <Panel title="Project Team" icon={<FiLayers />}>
        <form className="stack" onSubmit={assignTeam}>
          <RecordSelect label="Project team" records={teams} value={projectTeamForm.teamId} onChange={(teamId) => setProjectTeamForm({ ...projectTeamForm, teamId })} />
          <TextField label="Project team role" value={projectTeamForm.role} onChange={(role) => setProjectTeamForm({ ...projectTeamForm, role })} />
          <button className="primary-button" disabled={action.pending || !context.projectId || !projectTeamForm.teamId} type="submit"><FiCheck />Assign</button>
        </form>
      </Panel>
      <Panel title="Iterations" icon={<FiActivity />}>
        <form className="stack create-strip" onSubmit={createIteration}>
          <TextField label="Iteration name" value={iterationForm.name} onChange={(name) => setIterationForm({ ...iterationForm, name })} />
          <RecordSelect label="Iteration team" records={teams} value={iterationForm.teamId} onChange={(teamId) => setIterationForm({ ...iterationForm, teamId })} includeBlank />
          <TextField label="Iteration start" value={iterationForm.startDate} onChange={(startDate) => setIterationForm({ ...iterationForm, startDate })} />
          <TextField label="Iteration end" value={iterationForm.endDate} onChange={(endDate) => setIterationForm({ ...iterationForm, endDate })} />
          <button className="secondary-button" disabled={action.pending || !context.projectId} type="submit"><FiPlus />Create</button>
        </form>
      </Panel>
      <Panel title="Board" icon={<FiList />}>
        <form className="stack" onSubmit={createBoard}>
          <TextField label="Board name" value={boardForm.name} onChange={(name) => setBoardForm({ ...boardForm, name })} />
          <SelectField label="Board type" value={boardForm.type} onChange={(type) => setBoardForm({ ...boardForm, type })} options={['kanban', 'scrum']} />
          <RecordSelect label="Board team" records={teams} value={boardForm.teamId} onChange={(teamId) => setBoardForm({ ...boardForm, teamId })} includeBlank />
          <SelectField label="Project scoped" value={boardForm.projectScoped} onChange={(projectScoped) => setBoardForm({ ...boardForm, projectScoped })} options={['true', 'false']} />
          <button className="primary-button" disabled={action.pending || !context.projectId} type="submit"><FiPlus />Create board</button>
        </form>
      </Panel>
      <Panel title="Board Layout" icon={<FiSliders />}>
        <form className="stack" onSubmit={createColumn}>
          <RecordSelect label="Board" records={boards} value={boardId} onChange={setBoardId} />
          <TextField label="Column name" value={columnForm.name} onChange={(name) => setColumnForm({ ...columnForm, name })} />
          <div className="two-column compact">
            <TextField label="Column position" type="number" value={columnForm.position} onChange={(position) => setColumnForm({ ...columnForm, position })} />
            <TextField label="Column WIP limit" type="number" value={columnForm.wipLimit} onChange={(wipLimit) => setColumnForm({ ...columnForm, wipLimit })} />
          </div>
          <SelectField label="Done column" value={columnForm.doneColumn} onChange={(doneColumn) => setColumnForm({ ...columnForm, doneColumn })} options={['false', 'true']} />
          <button className="primary-button" disabled={action.pending || !boardId} type="submit"><FiPlus />Add column</button>
        </form>
        <form className="stack nested-form" onSubmit={createSwimlane}>
          <TextField label="Swimlane name" value={swimlaneForm.name} onChange={(name) => setSwimlaneForm({ ...swimlaneForm, name })} />
          <SelectField label="Swimlane mode" value={swimlaneForm.mode} onChange={(mode) => setSwimlaneForm({ ...swimlaneForm, mode })} options={['simple', 'saved_filter']} />
          {swimlaneForm.mode === 'saved_filter' ? (
            <RecordSelect label="Saved filter" records={savedFilters} value={swimlaneForm.savedFilterId} onChange={(savedFilterId) => setSwimlaneForm({ ...swimlaneForm, savedFilterId })} />
          ) : (
            <div className="two-column compact">
              <SelectField label="Swimlane type" value={swimlaneForm.swimlaneType} onChange={(swimlaneType) => setSwimlaneForm({ ...swimlaneForm, swimlaneType })} options={['query', 'team', 'assignee', 'reporter', 'type', 'priority']} />
              <SelectField label="Swimlane field" value={swimlaneForm.field} onChange={(field) => setSwimlaneForm({ ...swimlaneForm, field })} options={['assigneeId', 'reporterId', 'teamId', 'typeKey', 'priorityKey', 'statusId']} />
              <SelectField label="Swimlane operator" value={swimlaneForm.operator} onChange={(operator) => setSwimlaneForm({ ...swimlaneForm, operator })} options={['is_not_null', 'is_null', 'eq', 'ne', 'contains']} />
              <TextField label="Swimlane value" value={swimlaneForm.value} onChange={(value) => setSwimlaneForm({ ...swimlaneForm, value })} />
            </div>
          )}
          <button className="secondary-button" disabled={action.pending || !boardId} type="submit"><FiPlus />Add swimlane</button>
        </form>
      </Panel>
      <Panel title="Release" icon={<FiActivity />}>
        <form className="stack" onSubmit={createRelease}>
          <TextField label="Release name" value={releaseForm.name} onChange={(name) => setReleaseForm({ ...releaseForm, name })} />
          <TextField label="Release version" value={releaseForm.version} onChange={(version) => setReleaseForm({ ...releaseForm, version })} />
          <div className="two-column compact">
            <TextField label="Release start" value={releaseForm.startDate} onChange={(startDate) => setReleaseForm({ ...releaseForm, startDate })} />
            <TextField label="Release date" value={releaseForm.releaseDate} onChange={(releaseDate) => setReleaseForm({ ...releaseForm, releaseDate })} />
          </div>
          <SelectField label="Release status" value={releaseForm.status} onChange={(status) => setReleaseForm({ ...releaseForm, status })} options={['planned', 'active', 'released', 'archived']} />
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
          <TextField label="Roadmap name" value={roadmapForm.name} onChange={(name) => setRoadmapForm({ ...roadmapForm, name })} />
          <SelectField label="Roadmap visibility" value={roadmapForm.visibility} onChange={(visibility) => setRoadmapForm({ ...roadmapForm, visibility })} options={['private', 'project', 'workspace', 'public']} />
          <TextField label="Roadmap lanes" value={roadmapForm.lanes} onChange={(lanes) => setRoadmapForm({ ...roadmapForm, lanes })} />
          <button className="primary-button" disabled={action.pending || !context.workspaceId || !context.projectId} type="submit"><FiPlus />Create roadmap</button>
        </form>
        <form className="stack nested-form" onSubmit={createRoadmapItem}>
          <RecordSelect label="Roadmap" records={roadmaps} value={roadmapId} onChange={setRoadmapId} />
          <RecordSelect label="Work item" records={workItems} value={roadmapItemForm.workItemId} onChange={(workItemId) => setRoadmapItemForm({ ...roadmapItemForm, workItemId })} />
          <div className="two-column compact">
            <TextField label="Roadmap item start" value={roadmapItemForm.startDate} onChange={(startDate) => setRoadmapItemForm({ ...roadmapItemForm, startDate })} />
            <TextField label="Roadmap item end" value={roadmapItemForm.endDate} onChange={(endDate) => setRoadmapItemForm({ ...roadmapItemForm, endDate })} />
          </div>
          <TextField label="Roadmap item lane" value={roadmapItemForm.lane} onChange={(lane) => setRoadmapItemForm({ ...roadmapItemForm, lane })} />
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
        <div className="data-columns three no-margin">
          <DetailLinkGrid title="Board Routes" items={boards} basePath="/planning/boards" />
          <DetailLinkGrid title="Release Routes" items={releases} basePath="/planning/releases" />
          <DetailLinkGrid title="Roadmap Routes" items={roadmaps} basePath="/planning/roadmaps" />
        </div>
        <div className="data-columns">
          <JsonPreview title="Teams" value={teams} />
          <JsonPreview title="Project Teams" value={projectTeams} />
          <JsonPreview title="Iterations" value={iterations} />
          <JsonPreview title="Boards" value={boards} />
          <JsonPreview title="Columns" value={boardColumns} />
          <JsonPreview title="Swimlanes" value={boardSwimlanes} />
          <JsonPreview title="Board Work" value={boardWorkItems} />
          <JsonPreview title="Saved Filters" value={savedFilters} />
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

const swimlaneQuery = (form) => {
  if (form.mode === 'saved_filter') {
    return {};
  }
  const predicate = {
    field: form.field || 'assigneeId',
    operator: form.operator || 'is_not_null',
  };
  if (!['is_null', 'is_not_null'].includes(predicate.operator)) {
    predicate.value = form.value;
  }
  return { where: predicate };
};
