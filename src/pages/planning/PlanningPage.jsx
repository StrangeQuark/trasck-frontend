import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiActivity, FiArrowRight, FiCheckSquare, FiList, FiSettings, FiTrello } from 'react-icons/fi';
import { EmptyState } from '../../components/EmptyState';
import { ErrorLine } from '../../components/ErrorLine';
import { Panel } from '../../components/Panel';
import { PlanningSubnav } from '../../components/PlanningSubnav';
import { StatusPill } from '../../components/StatusPill';
import { SummaryRows } from '../../components/SummaryRows';
import { useApiAction } from '../../hooks/useApiAction';
import { countScopedWorkItems, groupIterationsByStatus, iterationLabel, loadIterationScopes, pickPreferredBoard, pickPrimaryIteration } from './planningUtils';

export const PlanningPage = ({ context }) => {
  const [teams, setTeams] = useState([]);
  const [iterations, setIterations] = useState([]);
  const [boards, setBoards] = useState([]);
  const [iterationScopes, setIterationScopes] = useState(new Map());
  const action = useApiAction(context.addToast);
  const canReadWorkspace = context.hasWorkspacePermission('workspace.read');
  const canReadProject = context.hasProjectPermission('project.read');
  const showAdmin = context.hasWorkspacePermission('workspace.admin')
    || context.hasProjectPermission('project.admin')
    || context.hasProjectPermission('board.admin');

  const load = async () => {
    if (!context.projectId) {
      action.setError('Select a project before loading planning');
      return;
    }
    if (!canReadProject) {
      action.setError('Your current project role cannot read planning');
      return;
    }
    const result = await action.run(async () => {
      const [teamRows, iterationRows, boardRows] = await Promise.all([
        canReadWorkspace && context.workspaceId ? context.services.planning.listTeams(context.workspaceId) : Promise.resolve([]),
        context.services.planning.listIterations(context.projectId),
        context.services.planning.listBoards(context.projectId),
      ]);
      const scopes = await loadIterationScopes(context.services.planning, iterationRows || []);
      return {
        teamRows,
        iterationRows,
        boardRows,
        scopes,
      };
    });
    if (result) {
      setTeams(result.teamRows || []);
      setIterations(result.iterationRows || []);
      setBoards(result.boardRows || []);
      setIterationScopes(result.scopes || new Map());
    }
  };

  useEffect(() => {
    if (context.projectId && canReadProject) {
      load();
    }
  }, [context.projectId, canReadProject]);

  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);
  const groupedIterations = useMemo(() => groupIterationsByStatus(iterations), [iterations]);
  const primaryIteration = useMemo(() => pickPrimaryIteration(iterations), [iterations]);
  const preferredBoard = useMemo(() => pickPreferredBoard(boards, primaryIteration), [boards, primaryIteration]);

  return (
    <div className="planning-layout">
      <PlanningSubnav showAdmin={showAdmin} />
      <div className="content-grid">
        <Panel title="Sprint Flow" icon={<FiActivity />} wide>
          <div className="planning-hero">
            <div className="planning-hero-copy">
              <h3>{primaryIteration ? primaryIteration.name : 'No iteration ready yet'}</h3>
              <p>{primaryIteration ? iterationLabel(primaryIteration, teamsById) : 'Create a team, create an iteration, and then plan work into it from the backlog.'}</p>
            </div>
            <div className="button-row wrap">
              <Link className="primary-button" to="/planning/backlog"><FiList />Backlog</Link>
              <Link className="secondary-button" to="/planning/active-board"><FiTrello />Active Board</Link>
              {showAdmin && <Link className="secondary-button" to="/planning/admin"><FiSettings />Planning Admin</Link>}
            </div>
          </div>
          <SummaryRows rows={[
            ['Active Iterations', String(groupedIterations.active.length)],
            ['Planned Iterations', String(groupedIterations.planned.length)],
            ['Closed Iterations', String(groupedIterations.closed.length)],
            ['Preferred Board', preferredBoard?.name || 'None'],
          ]} />
          <ErrorLine message={action.error} />
        </Panel>
        <IterationPanel
          emptyLabel="No active iterations"
          iterations={groupedIterations.active}
          scopeCounts={iterationScopes}
          teamsById={teamsById}
          title="Active Iterations"
        />
        <IterationPanel
          emptyLabel="No planned iterations"
          iterations={groupedIterations.planned}
          scopeCounts={iterationScopes}
          teamsById={teamsById}
          title="Planned Iterations"
        />
        <IterationPanel
          emptyLabel="No closed iterations"
          iterations={groupedIterations.closed}
          scopeCounts={iterationScopes}
          teamsById={teamsById}
          title="Closed Iterations"
        />
        <Panel title="Boards" icon={<FiCheckSquare />}>
          {boards.length === 0 ? (
            <EmptyState label="No boards configured" />
          ) : (
            <div className="planning-record-list">
              {boards.map((board) => (
                <Link className="planning-record" key={board.id} to={`/planning/boards/${board.id}`}>
                  <div>
                    <strong>{board.name}</strong>
                    <span>{[board.type, board.teamId ? teamsById.get(board.teamId)?.name : 'project-wide'].filter(Boolean).join(' | ')}</span>
                  </div>
                  <FiArrowRight />
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};

const IterationPanel = ({ emptyLabel, iterations, scopeCounts, teamsById, title }) => (
  <Panel title={title} icon={<FiCheckSquare />}>
    {!iterations || iterations.length === 0 ? (
      <EmptyState label={emptyLabel} />
    ) : (
      <div className="planning-record-list">
        {iterations.map((iteration) => (
          <article className="planning-record-card" key={iteration.id}>
            <div className="planning-record-header">
              <strong>{iteration.name}</strong>
              <StatusPill active={iteration.status === 'active'} label={iteration.status} />
            </div>
            <span>{iteration.teamId ? teamsById.get(iteration.teamId)?.name || iteration.teamId : 'Project-wide iteration'}</span>
            <span>{[iteration.startDate, iteration.endDate].filter(Boolean).join(' to ') || 'No dates set'}</span>
            <span>{countScopedWorkItems(scopeCounts, iteration.id)} scoped work items</span>
          </article>
        ))}
      </div>
    )}
  </Panel>
);
