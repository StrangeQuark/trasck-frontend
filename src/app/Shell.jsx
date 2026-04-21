import { useEffect, useState } from 'react';
import { FiActivity, FiBarChart2, FiBell, FiCheck, FiCpu, FiDatabase, FiFilter, FiKey, FiLayers, FiList, FiLogIn, FiSettings, FiShield, FiSliders, FiUploadCloud, FiUsers } from 'react-icons/fi';
import { normalizeBaseUrl } from '../api/client';
import { InlineId } from '../components/InlineId';
import { RouteLink } from '../components/RouteLink';
import { StatusPill } from '../components/StatusPill';

export const Shell = ({ children, context }) => {
  const { apiBaseUrl, currentUser, setApiBaseUrl, workspaceId, projectId } = context;
  const [draftBaseUrl, setDraftBaseUrl] = useState(apiBaseUrl);

  useEffect(() => {
    setDraftBaseUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  const saveConnection = (event) => {
    event.preventDefault();
    setApiBaseUrl(normalizeBaseUrl(draftBaseUrl));
    context.addToast('Connection saved', 'success');
  };

  return (
    <>
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">T</span>
          <div>
            <span className="app-kicker">Trasck</span>
            <h1>Project Console</h1>
          </div>
        </div>
        <form className="connection-form" onSubmit={saveConnection}>
          <input aria-label="Backend URL" value={draftBaseUrl} onChange={(event) => setDraftBaseUrl(event.target.value)} />
          <button className="icon-button" title="Save backend URL" type="submit">
            <FiCheck />
          </button>
        </form>
        <StatusPill active={Boolean(currentUser)} label={currentUser?.displayName || currentUser?.username || 'Signed out'} />
      </header>

      <nav className="route-tabs" aria-label="Primary">
        <RouteLink to="/" icon={<FiActivity />} label="Overview" />
        <RouteLink to="/setup" icon={<FiDatabase />} label="Setup" />
        <RouteLink to="/auth" icon={<FiLogIn />} label="Auth" />
        <RouteLink to="/work" icon={<FiList />} label="Work" />
        <RouteLink to="/planning" icon={<FiUsers />} label="Planning" />
        <RouteLink to="/programs" icon={<FiLayers />} label="Programs" />
        <RouteLink to="/configuration" icon={<FiSliders />} label="Config" />
        <RouteLink to="/automation" icon={<FiBell />} label="Automation" />
        <RouteLink to="/imports" icon={<FiUploadCloud />} label="Imports" />
        <RouteLink to="/filters" icon={<FiFilter />} label="Filters" />
        <RouteLink to="/dashboards" icon={<FiBarChart2 />} label="Dashboards" />
        <RouteLink to="/agents" icon={<FiCpu />} label="Agents" />
        <RouteLink to="/tokens" icon={<FiKey />} label="Tokens" />
        <RouteLink to="/system" icon={<FiShield />} label="System" />
        <RouteLink to="/workspace-settings" icon={<FiUsers />} label="Workspace" />
        <RouteLink to="/project-settings" icon={<FiSettings />} label="Project" />
      </nav>

      <section className="context-strip">
        <InlineId label="Workspace" value={workspaceId} onChange={context.setWorkspaceId} />
        <InlineId label="Project" value={projectId} onChange={context.setProjectId} />
      </section>

      <section className="page-frame">
        {children}
      </section>
    </>
  );
};
