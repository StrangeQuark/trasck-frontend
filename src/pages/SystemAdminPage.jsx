import { useEffect, useState } from 'react';
import { FiRefreshCw, FiShield, FiSlash, FiUserPlus } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';

export const SystemAdminPage = ({ context }) => {
  const [admins, setAdmins] = useState([]);
  const [grantUserId, setGrantUserId] = useState('');
  const action = useApiAction(context.addToast);

  const loadAdmins = async () => {
    const loaded = await action.run(() => context.services.security.listSystemAdmins());
    if (loaded) {
      setAdmins(loaded || []);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const grantAdmin = async (event) => {
    event.preventDefault();
    const granted = await action.run(() => context.services.security.grantSystemAdmin({ userId: grantUserId }), 'System admin granted');
    if (granted) {
      setGrantUserId('');
      await loadAdmins();
    }
  };

  const revokeAdmin = async (userId) => {
    const revoked = await action.run(() => context.services.security.revokeSystemAdmin(userId), 'System admin revoked');
    if (revoked) {
      await loadAdmins();
    }
  };

  return (
    <div className="content-grid">
      <Panel title="System Admins" icon={<FiShield />}>
        <div className="stack">
          <form className="stack" onSubmit={grantAdmin}>
            <TextField label="User ID" value={grantUserId} onChange={setGrantUserId} />
            <div className="button-row wrap">
              <button className="secondary-button" disabled={action.pending} onClick={loadAdmins} type="button"><FiRefreshCw />Load</button>
              <button className="primary-button" disabled={action.pending || !grantUserId} type="submit"><FiUserPlus />Grant</button>
            </div>
          </form>
          <div className="work-list">
            {admins.map((admin) => (
              <article className="work-row" key={admin.id || admin.userId}>
                <span className="work-key">{admin.active ? 'active' : 'inactive'}</span>
                <span className="work-title">{admin.displayName || admin.username || admin.email || admin.userId}</span>
                <button className="icon-button danger" disabled={action.pending || !admin.active} onClick={() => revokeAdmin(admin.userId)} title="Revoke system admin" type="button"><FiSlash /></button>
              </article>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Security State" icon={<FiShield />} wide>
        <ErrorLine message={action.error} />
        <JsonPreview title="System Admins" value={admins} />
      </Panel>
    </div>
  );
};
