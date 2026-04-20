import { useState } from 'react';
import { FiEye, FiLogIn, FiLogOut, FiRefreshCw } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';

export const AuthPage = ({ context }) => {
  const [loginForm, setLoginForm] = useState({ identifier: defaultSetupForm.email, password: defaultSetupForm.password });
  const action = useApiAction(context.addToast);

  const login = async (event) => {
    event.preventDefault();
    const session = await action.run(() => context.services.auth.login(loginForm), 'Signed in');
    if (session) {
      context.setCurrentUser(session.user || null);
    }
  };

  const refresh = async () => {
    const user = await action.run(() => context.services.auth.me(), 'Session refreshed');
    if (user) {
      context.setCurrentUser(user);
    }
  };

  const logout = async () => {
    await action.run(() => context.services.auth.logout(), 'Signed out');
    context.setCurrentUser(null);
  };

  return (
    <div className="content-grid">
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
            <button className="icon-button danger" disabled={action.pending} onClick={logout} title="Logout" type="button">
              <FiLogOut />
            </button>
          </div>
          <ErrorLine message={action.error} />
        </form>
      </Panel>
      <Panel title="Current User" icon={<FiEye />}>
        <JsonPreview value={context.currentUser} />
      </Panel>
    </div>
  );
};
