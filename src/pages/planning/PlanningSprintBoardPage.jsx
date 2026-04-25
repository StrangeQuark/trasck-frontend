import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiRefreshCw, FiTrello } from 'react-icons/fi';
import { BoardCardColumns } from '../../components/BoardCardColumns';
import { EmptyState } from '../../components/EmptyState';
import { ErrorLine } from '../../components/ErrorLine';
import { Panel } from '../../components/Panel';
import { PlanningSubnav } from '../../components/PlanningSubnav';
import { RecordSelect } from '../../components/RecordSelect';
import { SummaryRows } from '../../components/SummaryRows';
import { useApiAction } from '../../hooks/useApiAction';
import { countScopedWorkItems, iterationLabel, loadIterationScopes, pickPreferredBoard, pickPrimaryIteration } from './planningUtils';

export const PlanningSprintBoardPage = ({ context }) => {
  const [teams, setTeams] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [boards, setBoards] = useState([]);
  const [iterationScopes, setIterationScopes] = useState(new Map());
  const [boardWorkItems, setBoardWorkItems] = useState(null);
  const [selectedIterationId, setSelectedIterationId] = useState('');
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const action = useApiAction(context.addToast);
  const canReadProject = context.hasProjectPermission('project.read');
  const canReadWorkItems = context.hasProjectPermission('work_item.read');
  const canReadWorkspace = context.hasWorkspacePermission('workspace.read');
  const canManagePlanning = context.hasProjectPermission('board.admin');
  const showAdmin = canManagePlanning || context.hasWorkspacePermission('workspace.admin') || context.hasProjectPermission('project.admin');

  const loadSelections = async () => {
    if (!context.projectId) {
      action.setError('Select a project before loading the sprint board');
      return;
    }
    if (!canReadProject || !canReadWorkItems) {
      action.setError('Your current project role cannot load the sprint board');
      return;
    }
    const result = await action.run(async () => {
      const [teamRows, iterationRows, boardRows] = await Promise.all([
        canReadWorkspace && context.workspaceId ? context.services.planning.listTeams(context.workspaceId) : Promise.resolve([]),
        context.services.planning.listIterations(context.projectId),
        context.services.planning.listBoards(context.projectId),
      ]);
      const scopes = await loadIterationScopes(context.services.planning, iterationRows || []);
      return { teamRows, iterationRows, boardRows, scopes };
    });
    if (result) {
      const defaultIteration = pickPrimaryIteration(result.iterationRows || []);
      setTeams(result.teamRows || []);
      setIterations(result.iterationRows || []);
      setBoards(result.boardRows || []);
      setIterationScopes(result.scopes || new Map());
      setSelectedIterationId((current) => current && (result.iterationRows || []).some((iteration) => iteration.id === current)
        ? current
        : defaultIteration?.id || '');
      setSelectedBoardId((current) => {
        if (current && (result.boardRows || []).some((board) => board.id === current)) {
          return current;
        }
        return pickPreferredBoard(result.boardRows || [], defaultIteration)?.id || '';
      });
    }
  };

  const loadBoard = async (boardId, iterationId) => {
    if (!boardId || !iterationId) {
      setBoardWorkItems(null);
      return;
    }
    const iteration = iterations.find((row) => row.id === iterationId);
    const boardRows = await action.run(() => context.services.planning.listBoardWorkItems(boardId, {
      limitPerColumn: 100,
      iterationId,
      teamId: iteration?.teamId || undefined,
      viewMode: 'iteration',
    }));
    if (boardRows) {
      setBoardWorkItems(boardRows);
    }
  };

  useEffect(() => {
    if (context.projectId && canReadProject && canReadWorkItems) {
      loadSelections();
    }
  }, [context.projectId, canReadProject, canReadWorkItems]);

  useEffect(() => {
    if (selectedIterationId && !selectedBoardId) {
      const selectedIteration = iterations.find((iteration) => iteration.id === selectedIterationId);
      const board = pickPreferredBoard(boards, selectedIteration);
      if (board?.id) {
        setSelectedBoardId(board.id);
      }
    }
  }, [selectedIterationId, selectedBoardId, boards, iterations]);

  useEffect(() => {
    if (selectedBoardId && selectedIterationId) {
      loadBoard(selectedBoardId, selectedIterationId);
    }
  }, [selectedBoardId, selectedIterationId]);

  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const selectedIteration = useMemo(() => iterations.find((iteration) => iteration.id === selectedIterationId) || null, [iterations, selectedIterationId]);
  const selectedBoard = useMemo(() => boards.find((board) => board.id === selectedBoardId) || null, [boards, selectedBoardId]);

  const refresh = async () => {
    await loadSelections();
    await loadBoard(selectedBoardId, selectedIterationId);
  };

  const startIteration = async () => {
    if (!selectedIterationId) {
      action.setError('Choose an iteration before starting it');
      return;
    }
    await action.run(() => context.services.planning.commitIteration(selectedIterationId, {}), 'Iteration started');
    await refresh();
  };

  const moveWorkItem = async (workItemId, request) => {
    if (!canManagePlanning || !selectedBoardId) {
      return;
    }
    const moved = await action.run(() => context.services.planning.moveBoardWorkItem(selectedBoardId, workItemId, request), 'Board card moved');
    if (moved) {
      await loadBoard(selectedBoardId, selectedIterationId);
    }
  };

  return (
    <div className="planning-layout">
      <PlanningSubnav showAdmin={showAdmin} />
      <div className="content-grid">
        <Panel title="Active Sprint Board" icon={<FiTrello />} wide>
          <div className="planning-toolbar">
            <RecordSelect label="Iteration" records={iterations} value={selectedIterationId} onChange={setSelectedIterationId} includeBlank />
            <RecordSelect label="Board" records={boards} value={selectedBoardId} onChange={setSelectedBoardId} includeBlank />
            <div className="button-row wrap">
              <button className="secondary-button" disabled={action.pending} onClick={refresh} type="button"><FiRefreshCw />Refresh</button>
              <Link className="secondary-button" to="/planning/backlog"><FiArrowRight />Backlog</Link>
              {selectedBoard && <Link className="secondary-button" to={`/planning/boards/${selectedBoard.id}`}><FiArrowRight />Board Detail</Link>}
              {canManagePlanning && selectedIteration?.status === 'planned' && (
                <button className="primary-button" disabled={action.pending || !selectedIterationId} onClick={startIteration} type="button"><FiCheck />Start sprint</button>
              )}
            </div>
          </div>
          <SummaryRows rows={[
            ['Iteration', iterationLabel(selectedIteration, teamsById)],
            ['Board', selectedBoard?.name || 'None'],
            ['Board Type', selectedBoard?.type || 'None'],
            ['Scoped Work', String(countScopedWorkItems(iterationScopes, selectedIterationId))],
          ]} />
          <ErrorLine message={action.error} />
        </Panel>
        <Panel title="Board" icon={<FiTrello />} wide>
          {!selectedIteration ? (
            <EmptyState label="No iteration selected" />
          ) : !selectedBoard ? (
            <EmptyState label="No board selected" />
          ) : (
            <BoardCardColumns boardWorkItems={boardWorkItems} onMove={canManagePlanning ? moveWorkItem : undefined} />
          )}
        </Panel>
      </div>
    </div>
  );
};
