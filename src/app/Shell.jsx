import { Link } from 'react-router-dom';
import { FiActivity, FiBarChart2, FiBell, FiCpu, FiDatabase, FiFilter, FiKey, FiLayers, FiList, FiLogIn, FiSettings, FiShield, FiSliders, FiUploadCloud, FiUsers } from 'react-icons/fi';
import { RouteLink } from '../components/RouteLink';
import { StatusPill } from '../components/StatusPill';

export const Shell = ({ children, context }) => {
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

  return (
    <>
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">T</span>
          <div>
            <span className="app-kicker">Trasck</span>
            <h1>Project management</h1>
          </div>
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

      <nav className="route-tabs" aria-label="Primary">
        <RouteLink to="/" icon={<FiActivity />} label="Overview" />
        {!signedIn && setupAvailable && <RouteLink to="/setup" icon={<FiDatabase />} label="Setup" />}
        {!signedIn && <RouteLink to="/auth" icon={<FiLogIn />} label="Sign in" />}
        {signedIn && hasProjectPermission('work_item.read') && <RouteLink to="/work" icon={<FiList />} label="Work" />}
        {signedIn && hasAnyProjectPermission(['project.read', 'board.admin']) && <RouteLink to="/planning" icon={<FiUsers />} label="Planning" />}
        {signedIn && hasWorkspacePermission('workspace.read') && <RouteLink to="/programs" icon={<FiLayers />} label="Programs" />}
        {signedIn && hasWorkspacePermission('workspace.read') && <RouteLink to="/configuration" icon={<FiSliders />} label="Config" />}
        {signedIn && hasWorkspacePermission('automation.admin') && <RouteLink to="/automation" icon={<FiBell />} label="Automation" />}
        {signedIn && hasWorkspacePermission('workspace.admin') && <RouteLink to="/imports" icon={<FiUploadCloud />} label="Imports" />}
        {signedIn && (hasWorkspacePermission('workspace.read') || hasWorkspacePermission('report.read')) && <RouteLink to="/filters" icon={<FiFilter />} label="Filters" />}
        {signedIn && hasWorkspacePermission('report.read') && <RouteLink to="/dashboards" icon={<FiBarChart2 />} label="Dashboards" />}
        {signedIn && hasAnyWorkspacePermission(['agent.provider.manage', 'agent.profile.manage', 'repository_connection.manage']) && <RouteLink to="/agents" icon={<FiCpu />} label="Agents" />}
      </nav>

      {signedIn && (
        <nav className="route-tabs admin-tabs" aria-label="Administration">
          <RouteLink to="/tokens" icon={<FiKey />} label="Tokens" />
          {systemAdmin && <RouteLink to="/system" icon={<FiShield />} label="System" />}
          {hasAnyWorkspacePermission(['workspace.admin', 'user.manage']) && <RouteLink to="/workspace-settings" icon={<FiUsers />} label="Workspace" />}
          {hasProjectPermission('project.admin') && <RouteLink to="/project-settings" icon={<FiSettings />} label="Project" />}
        </nav>
      )}

      <section className="page-frame">
        {children}
      </section>
    </>
  );
};
