import { NavLink } from 'react-router-dom';

export const RouteLink = ({ icon, label, to, variant = 'tab' }) => (
  <NavLink
    className={({ isActive }) => `${variant === 'sidebar' ? 'sidebar-link' : 'route-tab'}${isActive ? ' active' : ''}`}
    end={to === '/'}
    to={to}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);
