import { NavLink } from 'react-router-dom';
import { FiBarChart2, FiBell, FiCpu, FiFilter, FiKey, FiLayers, FiList, FiLogIn, FiShield, FiSliders, FiUploadCloud, FiUsers } from 'react-icons/fi';
import { Panel } from '../components/Panel';
import { SummaryRows } from '../components/SummaryRows';

export const OverviewPage = ({ context }) => {
  const signedIn = Boolean(context.currentUser);
  const buildTiles = [
    signedIn && context.hasProjectPermission('work_item.read') && { to: '/work', icon: <FiList />, label: 'Work items' },
    signedIn && context.hasAnyProjectPermission(['project.read', 'board.admin']) && { to: '/planning', icon: <FiUsers />, label: 'Planning' },
    signedIn && context.hasWorkspacePermission('workspace.read') && { to: '/programs', icon: <FiLayers />, label: 'Programs' },
    signedIn && context.hasWorkspacePermission('workspace.read') && { to: '/configuration', icon: <FiSliders />, label: 'Config' },
    signedIn && (context.hasWorkspacePermission('workspace.read') || context.hasWorkspacePermission('report.read')) && { to: '/filters', icon: <FiFilter />, label: 'Filters' },
    signedIn && context.hasWorkspacePermission('report.read') && { to: '/dashboards', icon: <FiBarChart2 />, label: 'Dashboards' },
  ].filter(Boolean);
  const operationsTiles = [
    signedIn && context.hasWorkspacePermission('automation.admin') && { to: '/automation', icon: <FiBell />, label: 'Rules' },
    signedIn && context.hasWorkspacePermission('workspace.admin') && { to: '/imports', icon: <FiUploadCloud />, label: 'Imports' },
    signedIn
      && context.hasWorkspacePermission('agent.provider.manage')
      && context.hasWorkspacePermission('agent.profile.manage')
      && context.hasWorkspacePermission('repository_connection.manage')
      && { to: '/agents', icon: <FiCpu />, label: 'Agents' },
    signedIn && { to: '/tokens', icon: <FiKey />, label: 'API tokens' },
    signedIn && context.systemAdmin && { to: '/system', icon: <FiShield />, label: 'System' },
  ].filter(Boolean);

  return (
    <div className="content-grid three">
      <Panel title="Workspace" icon={<FiLogIn />}>
        <SummaryRows rows={[
          ['User', context.currentUser?.displayName || context.currentUser?.username || 'None'],
          ['Workspace', context.workspaceOptions.find((workspace) => workspace.id === context.workspaceId)?.name || 'None selected'],
          ['Project', context.projectOptions.find((project) => project.id === context.projectId)?.name || 'None selected'],
        ]} />
        {!context.currentUser && (
          <div className="button-row">
            <NavLink className="secondary-button" to="/auth">Sign in</NavLink>
            {context.setupAvailable && <NavLink className="secondary-button" to="/setup">First-run setup</NavLink>}
          </div>
        )}
      </Panel>
      <Panel title="Build" icon={<FiLayers />}>
        {buildTiles.length > 0 ? (
          <div className="action-grid">
            {buildTiles.map((tile) => (
              <NavLink className="action-tile" key={tile.to} to={tile.to}>
                {tile.icon}
                {tile.label}
              </NavLink>
            ))}
          </div>
        ) : (
          <p className="muted">No build surfaces are available for the current workspace and project selection.</p>
        )}
      </Panel>
      <Panel title="Automation" icon={<FiCpu />}>
        {operationsTiles.length > 0 ? (
          <div className="action-grid">
            {operationsTiles.map((tile) => (
              <NavLink className="action-tile" key={tile.to} to={tile.to}>
                {tile.icon}
                {tile.label}
              </NavLink>
            ))}
          </div>
        ) : (
          <p className="muted">No operations or administration surfaces are available for the current membership.</p>
        )}
      </Panel>
    </div>
  );
};
