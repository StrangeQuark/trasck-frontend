import { NavLink } from 'react-router-dom';
import { FiBarChart2, FiBell, FiCpu, FiFilter, FiKey, FiLayers, FiList, FiLogIn, FiShield, FiSliders, FiUploadCloud, FiUsers } from 'react-icons/fi';
import { Panel } from '../components/Panel';
import { SummaryRows } from '../components/SummaryRows';

export const OverviewPage = ({ context }) => (
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
        <NavLink className="action-tile" to="/programs"><FiLayers /> Programs</NavLink>
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
        <NavLink className="action-tile" to="/system"><FiShield /> System</NavLink>
      </div>
    </Panel>
  </div>
);
