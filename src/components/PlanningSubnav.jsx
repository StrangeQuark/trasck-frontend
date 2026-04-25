import { FiGrid, FiList, FiSettings, FiTrello } from 'react-icons/fi';
import { RouteLink } from './RouteLink';

export const PlanningSubnav = ({ showAdmin = false }) => (
  <nav className="route-tabs planning-subnav" aria-label="Planning views">
    <RouteLink to="/planning" icon={<FiGrid />} label="Overview" />
    <RouteLink to="/planning/backlog" icon={<FiList />} label="Backlog" />
    <RouteLink to="/planning/active-board" icon={<FiTrello />} label="Active Board" />
    {showAdmin && <RouteLink to="/planning/admin" icon={<FiSettings />} label="Admin" />}
  </nav>
);
