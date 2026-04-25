import { Link, useLocation } from 'react-router-dom';
import { FiBarChart2, FiBell, FiCpu, FiDatabase, FiFilter, FiHome, FiKey, FiLayers, FiList, FiLogIn, FiSettings, FiShield, FiSliders, FiUploadCloud, FiUsers } from 'react-icons/fi';
import { RouteLink } from '../components/RouteLink';
import { StatusPill } from '../components/StatusPill';

export const Shell = ({ children, context }) => {
  const location = useLocation();
  const {
    currentUser,
    hasAnyProjectPermission,
    hasAnyWorkspacePermission,
    hasProjectPermission,
    hasWorkspacePermission,
    projectId,
    projectOptions,
    selectWorkspace,
    setProjectId,
    setupAvailable,
    systemAdmin,
    workspaceId,
    workspaceOptions,
  } = context;
  const signedIn = Boolean(currentUser);
  const visibleProjects = projectOptions.filter((project) => !workspaceId || project.workspaceId === workspaceId);
  const activeWorkspace = workspaceOptions.find((workspace) => workspace.id === workspaceId);
  const activeProject = projectOptions.find((project) => project.id === projectId);
  const routeTitle = titleForPath(location.pathname);

  return (
    <div className="workspace-shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <Link className="brand-lockup" to="/">
          <span className="brand-mark">T</span>
          <span>
            <span className="app-kicker">Trasck</span>
            <h1>Project management</h1>
          </span>
        </Link>

        <nav className="sidebar-section" aria-label="Primary">
          <span className="sidebar-section-title">Project</span>
          <RouteLink variant="sidebar" to="/" icon={<FiHome />} label="Overview" />
          {!signedIn && setupAvailable && <RouteLink variant="sidebar" to="/setup" icon={<FiDatabase />} label="Setup" />}
          {!signedIn && <RouteLink variant="sidebar" to="/auth" icon={<FiLogIn />} label="Sign in" />}
          {signedIn && hasProjectPermission('work_item.read') && <RouteLink variant="sidebar" to="/work" icon={<FiList />} label="Work" />}
          {signedIn && hasAnyProjectPermission(['project.read', 'board.admin']) && <RouteLink variant="sidebar" to="/planning" icon={<FiUsers />} label="Planning" />}
          {signedIn && hasWorkspacePermission('report.read') && <RouteLink variant="sidebar" to="/dashboards" icon={<FiBarChart2 />} label="Dashboards" />}
          {signedIn && (hasWorkspacePermission('workspace.read') || hasWorkspacePermission('report.read')) && <RouteLink variant="sidebar" to="/filters" icon={<FiFilter />} label="Filters" />}
          {signedIn && hasWorkspacePermission('workspace.read') && <RouteLink variant="sidebar" to="/programs" icon={<FiLayers />} label="Programs" />}
        </nav>

        {signedIn && (
          <nav className="sidebar-section" aria-label="Operations">
            <span className="sidebar-section-title">Operations</span>
            {hasAnyWorkspacePermission(['agent.provider.manage', 'agent.profile.manage', 'repository_connection.manage']) && <RouteLink variant="sidebar" to="/agents" icon={<FiCpu />} label="Agents" />}
            {hasWorkspacePermission('automation.admin') && <RouteLink variant="sidebar" to="/automation" icon={<FiBell />} label="Automation" />}
            {hasWorkspacePermission('workspace.admin') && <RouteLink variant="sidebar" to="/imports" icon={<FiUploadCloud />} label="Imports" />}
          </nav>
        )}

        {signedIn && (
          <nav className="sidebar-section" aria-label="Administration">
            <span className="sidebar-section-title">Administration</span>
            {hasWorkspacePermission('workspace.read') && <RouteLink variant="sidebar" to="/configuration" icon={<FiSliders />} label="Configuration" />}
            {hasAnyWorkspacePermission(['workspace.admin', 'user.manage']) && <RouteLink variant="sidebar" to="/workspace-settings" icon={<FiUsers />} label="Workspace" />}
            {hasProjectPermission('project.admin') && <RouteLink variant="sidebar" to="/project-settings" icon={<FiSettings />} label="Project" />}
            <RouteLink variant="sidebar" to="/tokens" icon={<FiKey />} label="Tokens" />
            {systemAdmin && <RouteLink variant="sidebar" to="/system" icon={<FiShield />} label="System" />}
          </nav>
        )}
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <div className="page-title-block">
            <span className="page-eyebrow">{activeProject?.key || activeWorkspace?.key || 'Trasck'}</span>
            <span className="page-heading">{routeTitle}</span>
          </div>
          {signedIn && (
            <div className="context-selectors" aria-label="Workspace and project">
              <label>
                <span>Workspace</span>
                <select value={workspaceId || ''} onChange={(event) => selectWorkspace(event.target.value)}>
                  {!workspaceId && <option value="">Select workspace</option>}
                  {workspaceOptions.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>{workspace.name || workspace.key}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Project</span>
                <select value={projectId || ''} onChange={(event) => setProjectId(event.target.value)}>
                  {!projectId && <option value="">Select project</option>}
                  {visibleProjects.map((project) => (
                    <option key={project.id} value={project.id}>{project.key ? `${project.key} - ${project.name}` : project.name}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <Link className="account-link" to="/auth">
            <StatusPill active={signedIn} label={currentUser?.displayName || currentUser?.username || 'Sign in'} />
          </Link>
        </header>

        <section className="page-frame">
          {children}
        </section>
      </div>
    </div>
  );
};

const titleForPath = (pathname) => {
  if (pathname.startsWith('/planning/backlog')) {
    return 'Backlog';
  }
  if (pathname.startsWith('/planning/active-board')) {
    return 'Active board';
  }
  if (pathname.startsWith('/planning/admin')) {
    return 'Planning admin';
  }
  if (pathname.startsWith('/planning')) {
    return 'Planning';
  }
  if (pathname.startsWith('/work')) {
    return 'Work';
  }
  if (pathname.startsWith('/programs')) {
    return 'Programs';
  }
  if (pathname.startsWith('/configuration')) {
    return 'Configuration';
  }
  if (pathname.startsWith('/automation')) {
    return 'Automation';
  }
  if (pathname.startsWith('/imports')) {
    return 'Imports';
  }
  if (pathname.startsWith('/filters')) {
    return 'Filters';
  }
  if (pathname.startsWith('/dashboards')) {
    return 'Dashboards';
  }
  if (pathname.startsWith('/agents')) {
    return 'Agents';
  }
  if (pathname.startsWith('/tokens')) {
    return 'API tokens';
  }
  if (pathname.startsWith('/system')) {
    return 'System';
  }
  if (pathname.startsWith('/workspace-settings')) {
    return 'Workspace settings';
  }
  if (pathname.startsWith('/project-settings')) {
    return 'Project settings';
  }
  if (pathname.startsWith('/setup')) {
    return 'Initial setup';
  }
  if (pathname.startsWith('/auth')) {
    return 'Account';
  }
  if (pathname.startsWith('/public')) {
    return 'Public preview';
  }
  return 'Overview';
};
