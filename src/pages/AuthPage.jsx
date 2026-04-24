import { useState } from 'react';
import { FiLogIn, FiLogOut, FiRefreshCw, FiUser } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { Panel } from '../components/Panel';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';

export const AuthPage = ({ context }) => {
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const action = useApiAction(context.addToast);

  const login = async (event) => {
    event.preventDefault();
    const session = await action.run(() => context.services.auth.login(loginForm), 'Signed in');
    if (session) {
      context.setCurrentUser(session.user || null);
      await context.refreshSession?.();
    }
  };

  const refresh = async () => {
    await action.run(() => context.refreshSession(), 'Session refreshed');
  };

  const logout = async () => {
    await action.run(() => context.services.auth.logout(), 'Signed out');
    context.clearSessionContext?.();
  };

  const accountDetails = context.currentUser ? (
    <dl className="summary-rows">
      <div>
        <dt>Name</dt>
        <dd>{context.currentUser.displayName || context.currentUser.username}</dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd>{context.currentUser.email}</dd>
      </div>
      <div>
        <dt>Workspace</dt>
        <dd>{context.workspaceOptions.find((workspace) => workspace.id === context.workspaceId)?.name || 'None selected'}</dd>
      </div>
      <div>
        <dt>Project</dt>
        <dd>{context.projectOptions.find((project) => project.id === context.projectId)?.name || 'None selected'}</dd>
      </div>
    </dl>
  ) : (
    <p className="muted">Sign in to load your workspaces and projects.</p>
  );

  return (
    <div className="content-grid">
      {!context.currentUser && (
        <Panel title="Sign In" icon={<FiLogIn />}>
          <form className="stack" onSubmit={login}>
            <TextField label="Identifier" value={loginForm.identifier} onChange={(identifier) => setLoginForm({ ...loginForm, identifier })} />
            <TextField label="Password" type="password" value={loginForm.password} onChange={(password) => setLoginForm({ ...loginForm, password })} />
            <div className="button-row wrap">
              <button className="primary-button" disabled={action.pending} type="submit">
                <FiLogIn />
                Login
              </button>
              <button className="secondary-button" disabled={action.pending} onClick={refresh} type="button">
                <FiRefreshCw />
                Refresh
              </button>
            </div>
            <ErrorLine message={action.error} />
          </form>
        </Panel>
      )}
      <Panel title="Account" icon={<FiUser />}>
        {accountDetails}
        {context.currentUser && (
          <div className="button-row wrap">
            <button className="secondary-button" disabled={action.pending} onClick={refresh} type="button">
              <FiRefreshCw />
              Refresh
            </button>
            <button className="secondary-button danger" disabled={action.pending} onClick={logout} type="button">
              <FiLogOut />
              Logout
            </button>
          </div>
        )}
        <ErrorLine message={action.error} />
      </Panel>
    </div>
  );
};
