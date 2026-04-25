import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiList, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { EmptyState } from '../../components/EmptyState';
import { ErrorLine } from '../../components/ErrorLine';
import { Panel } from '../../components/Panel';
import { PlanningSubnav } from '../../components/PlanningSubnav';
import { RecordSelect } from '../../components/RecordSelect';
import { SummaryRows } from '../../components/SummaryRows';
import { useApiAction } from '../../hooks/useApiAction';
import { countScopedWorkItems, idsInAnyIteration, iterationLabel, loadIterationScopes, loadProjectWorkItems, pickPreferredBoard, pickPrimaryIteration } from './planningUtils';

export const PlanningBacklogPage = ({ context }) => {
  const [teams, setTeams] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [boards, setBoards] = useState([]);
  const [workItems, setWorkItems] = useState([]);
  const [iterationScopes, setIterationScopes] = useState(new Map());
  const [selectedIterationId, setSelectedIterationId] = useState('');
  const action = useApiAction(context.addToast);
  const canReadProject = context.hasProjectPermission('project.read');
  const canReadWorkItems = context.hasProjectPermission('work_item.read');
  const canReadWorkspace = context.hasWorkspacePermission('workspace.read');
  const canManagePlanning = context.hasProjectPermission('board.admin');
  const showAdmin = canManagePlanning || context.hasWorkspacePermission('workspace.admin') || context.hasProjectPermission('project.admin');

  const load = async () => {
    if (!context.projectId) {
      action.setError('Select a project before loading the backlog');
      return;
    }
    if (!canReadProject || !canReadWorkItems) {
      action.setError('Your current project role cannot load the backlog');
      return;
    }
    const result = await action.run(async () => {
      const [teamRows, iterationRows, boardRows, itemRows] = await Promise.all([
        canReadWorkspace && context.workspaceId ? context.services.planning.listTeams(context.workspaceId) : Promise.resolve([]),
        context.services.planning.listIterations(context.projectId),
        context.services.planning.listBoards(context.projectId),
        loadProjectWorkItems(context.services, context.projectId),
      ]);
      const scopes = await loadIterationScopes(context.services.planning, iterationRows || []);
      return { teamRows, iterationRows, boardRows, itemRows, scopes };
    });
    if (result) {
      setTeams(result.teamRows || []);
      setIterations(result.iterationRows || []);
      setBoards(result.boardRows || []);
      setWorkItems(result.itemRows || []);
      setIterationScopes(result.scopes || new Map());
      setSelectedIterationId((current) => {
        if (current && (result.iterationRows || []).some((iteration) => iteration.id === current)) {
          return current;
        }
        return pickPrimaryIteration(result.iterationRows || [])?.id || '';
      });
    }
  };

  useEffect(() => {
    if (context.projectId && canReadProject && canReadWorkItems) {
      load();
    }
  }, [context.projectId, canReadProject, canReadWorkItems]);

  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const selectedIteration = useMemo(() => iterations.find((iteration) => iteration.id === selectedIterationId) || null, [iterations, selectedIterationId]);
  const selectedBoard = useMemo(() => pickPreferredBoard(boards, selectedIteration), [boards, selectedIteration]);
  const selectedScopeIds = useMemo(() => selectedIterationId ? (iterationScopes.get(selectedIterationId) || new Set()) : new Set(), [iterationScopes, selectedIterationId]);
  const anyScopedIds = useMemo(() => idsInAnyIteration(iterationScopes), [iterationScopes]);
  const scopedItems = useMemo(() => workItems.filter((item) => selectedScopeIds.has(item.id)), [workItems, selectedScopeIds]);
  const backlogItems = useMemo(() => workItems.filter((item) => !anyScopedIds.has(item.id)), [workItems, anyScopedIds]);
  const otherIterationCount = useMemo(() => workItems.filter((item) => anyScopedIds.has(item.id) && !selectedScopeIds.has(item.id)).length, [workItems, anyScopedIds, selectedScopeIds]);

  const planIntoIteration = async (workItemId) => {
    if (!selectedIterationId) {
      action.setError('Choose an iteration before planning work');
      return;
    }
    await action.run(() => context.services.planning.addIterationWorkItem(selectedIterationId, { workItemId }), 'Work item planned into iteration');
    await load();
  };

  const removeFromIteration = async (workItemId) => {
    if (!selectedIterationId) {
      action.setError('Choose an iteration before removing scoped work');
      return;
    }
    await action.run(() => context.services.planning.removeIterationWorkItem(selectedIterationId, workItemId), 'Work item removed from iteration');
    await load();
  };

  const startIteration = async () => {
    if (!selectedIterationId) {
      action.setError('Choose an iteration before starting it');
      return;
    }
    await action.run(() => context.services.planning.commitIteration(selectedIterationId, {}), 'Iteration started');
    await load();
  };

  return (
    <div className="planning-layout">
      <PlanningSubnav showAdmin={showAdmin} />
      <div className="content-grid">
        <Panel title="Backlog" icon={<FiList />} wide>
          <div className="planning-toolbar">
            <RecordSelect
              label="Iteration"
              records={iterations}
              value={selectedIterationId}
              onChange={setSelectedIterationId}
              includeBlank
            />
            <div className="button-row wrap">
              <button className="secondary-button" disabled={action.pending} onClick={load} type="button"><FiRefreshCw />Refresh</button>
              {selectedBoard && <Link className="secondary-button" to="/planning/active-board"><FiArrowRight />Open board</Link>}
              {canManagePlanning && selectedIteration?.status === 'planned' && (
                <button className="primary-button" disabled={action.pending || !selectedIterationId} onClick={startIteration} type="button"><FiCheck />Start sprint</button>
              )}
            </div>
          </div>
          <SummaryRows rows={[
            ['Selected Iteration', iterationLabel(selectedIteration, teamsById)],
            ['Scoped Work', String(countScopedWorkItems(iterationScopes, selectedIterationId))],
            ['Backlog Candidates', String(backlogItems.length)],
            ['Other Iteration Work', String(otherIterationCount)],
          ]} />
          <ErrorLine message={action.error} />
        </Panel>
        <WorkItemBucket
          actionLabel="Plan"
          actionIcon={<FiCheck />}
          canManage={canManagePlanning}
          emptyLabel="No unplanned backlog items"
          items={backlogItems}
          onAction={planIntoIteration}
          title="Backlog Candidates"
        />
        <WorkItemBucket
          actionLabel="Remove"
          actionIcon={<FiTrash2 />}
          canManage={canManagePlanning}
          emptyLabel="No work is scoped to this iteration"
          items={scopedItems}
          onAction={removeFromIteration}
          title="Iteration Scope"
          tone="danger"
        />
      </div>
    </div>
  );
};

const WorkItemBucket = ({ actionIcon, actionLabel, canManage, emptyLabel, items, onAction, title, tone = 'primary' }) => (
  <Panel title={title} icon={<FiList />}>
    {!items || items.length === 0 ? (
      <EmptyState label={emptyLabel} />
    ) : (
      <div className="planning-work-list">
        {items.map((item) => (
          <article className="planning-work-row" key={item.id}>
            <div>
              <strong>{item.title}</strong>
              <span>{[item.key, item.estimatePoints ? `${item.estimatePoints} pts` : null].filter(Boolean).join(' | ')}</span>
            </div>
            {canManage && (
              <button className={tone === 'danger' ? 'secondary-button danger' : 'secondary-button'} onClick={() => onAction(item.id)} type="button">
                {actionIcon}{actionLabel}
              </button>
            )}
          </article>
        ))}
      </div>
    )}
  </Panel>
);
