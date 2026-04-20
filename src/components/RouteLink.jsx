import { NavLink } from 'react-router-dom';

export const RouteLink = ({ icon, label, to }) => (
  <NavLink className={({ isActive }) => 'route-tab' + (isActive ? ' active' : '')} end={to === '/'} to={to}>
    {icon}
    <span>{label}</span>
  </NavLink>
);
