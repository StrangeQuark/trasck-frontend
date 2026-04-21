import { useEffect, useState } from 'react';
import { FiMail, FiRefreshCw, FiSlash, FiTrash2, FiUserPlus, FiUsers } from 'react-icons/fi';
import { EmptyState } from '../components/EmptyState';
import { ErrorLine } from '../components/ErrorLine';
import { JsonPreview } from '../components/JsonPreview';
import { Panel } from '../components/Panel';
import { StatusPill } from '../components/StatusPill';
import { SummaryRows } from '../components/SummaryRows';
import { TextField } from '../components/TextField';
import { useApiAction } from '../hooks/useApiAction';

const INVITATION_STATUS_OPTIONS = ['pending', 'accepted', 'revoked', 'all'];
const MEMBER_STATUS_OPTIONS = ['active', 'removed', 'all'];

const defaultInvitationForm = {
  email: '',
  roleId: '',
  projectId: '',
  projectRoleId: '',
  expiresAt: '',
};

const defaultUserForm = {
  email: '',
  username: '',
  displayName: '',
  password: '',
  roleId: '',
  emailVerified: true,
};

export const WorkspaceSettingsPage = ({ context }) => {
  const [invitationForm, setInvitationForm] = useState(defaultInvitationForm);
  const [invitationStatus, setInvitationStatus] = useState('pending');
  const [invitations, setInvitations] = useState([]);
  const [memberStatus, setMemberStatus] = useState('active');
  const [members, setMembers] = useState([]);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [lastResult, setLastResult] = useState(null);
  const action = useApiAction(context.addToast);

  const loadWorkspaceSettings = async () => {
    if (!context.workspaceId) {
      setInvitations([]);
      setMembers([]);
      return;
    }
    const loaded = await action.run(() => Promise.all([
      context.services.security.listWorkspaceInvitations(context.workspaceId, { status: invitationStatus }),
      context.services.security.listWorkspaceUsers(context.workspaceId, { status: memberStatus }),
    ]));
    if (loaded) {
      setInvitations(loaded[0] || []);
      setMembers(loaded[1] || []);
    }
  };

  useEffect(() => {
    if (context.workspaceId) {
      loadWorkspaceSettings();
    }
  }, [context.workspaceId, invitationStatus, memberStatus]);

  const inviteUser = async (event) => {
    event.preventDefault();
    const invitation = await action.run(
      () => context.services.security.inviteWorkspaceUser(context.workspaceId, compactRequest(invitationForm)),
      'Invitation created',
    );
    if (invitation) {
      setLastResult(invitation);
      setInvitationForm(defaultInvitationForm);
      await loadWorkspaceSettings();
    }
  };

  const revokeInvitation = async (invitation) => {
    if (!window.confirm(`Revoke invitation for ${invitation.email || invitation.id}?`)) {
      return;
    }
    await action.run(
      () => context.services.security.cancelWorkspaceInvitation(context.workspaceId, invitation.id),
      'Invitation revoked',
    );
    await loadWorkspaceSettings();
  };

  const createUser = async (event) => {
    event.preventDefault();
    const user = await action.run(
      () => context.services.security.createWorkspaceUser(context.workspaceId, compactRequest(userForm)),
      'Workspace user created',
    );
    if (user) {
      setLastResult(user);
      setUserForm(defaultUserForm);
      await loadWorkspaceSettings();
    }
  };

  const removeUser = async (member) => {
    const label = member.displayName || member.username || member.email || member.userId;
    if (!window.confirm(`Remove ${label} from this workspace?`)) {
      return;
    }
    await action.run(
      () => context.services.security.removeWorkspaceUser(context.workspaceId, member.userId),
      'Workspace user removed',
    );
    await loadWorkspaceSettings();
  };

  return (
    <div className="content-grid">
      <Panel title="Workspace Members" icon={<FiUsers />} wide>
        <div className="stack">
          <SummaryRows rows={[
            ['Workspace', context.workspaceId],
            ['Loaded members', members.length],
          ]} />

          <div className="table-actions">
            <div className="table-filter">
              <span>Status</span>
              <select aria-label="Member status" value={memberStatus} onChange={(event) => setMemberStatus(event.target.value)}>
                {MEMBER_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadWorkspaceSettings} type="button">
              <FiRefreshCw />
              Load
            </button>
          </div>

          <div className="table-wrap">
            {members.length === 0 ? (
              <EmptyState label="No workspace members loaded" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const isCurrentUser = member.userId && member.userId === context.currentUser?.id;
                    return (
                      <tr key={member.membershipId || member.userId}>
                        <td>
                          <strong>{member.displayName || member.username || member.email || member.userId}</strong>
                          <div className="mono-cell">{member.email || member.userId}</div>
                        </td>
                        <td>{roleLabel(member)}</td>
                        <td><StatusPill active={member.status === 'active'} label={member.status || 'unknown'} /></td>
                        <td>{formatTimestamp(member.joinedAt || member.createdAt)}</td>
                        <td>
                          <button
                            className="secondary-button danger"
                            disabled={action.pending || !context.workspaceId || member.status !== 'active' || isCurrentUser}
                            onClick={() => removeUser(member)}
                            title={isCurrentUser ? 'Current user cannot remove themselves' : 'Remove workspace user'}
                            type="button"
                          >
                            <FiTrash2 />
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <form className="stack nested-form" onSubmit={createUser}>
            <div className="two-column">
              <TextField label="User email" value={userForm.email} onChange={(email) => setUserForm({ ...userForm, email })} />
              <TextField label="Username" value={userForm.username} onChange={(username) => setUserForm({ ...userForm, username })} />
              <TextField label="Display name" value={userForm.displayName} onChange={(displayName) => setUserForm({ ...userForm, displayName })} />
              <TextField label="Password" type="password" value={userForm.password} onChange={(password) => setUserForm({ ...userForm, password })} />
              <TextField label="Workspace role ID" value={userForm.roleId} onChange={(roleId) => setUserForm({ ...userForm, roleId })} />
              <label className="checkbox-row">
                <input type="checkbox" checked={userForm.emailVerified} onChange={(event) => setUserForm({ ...userForm, emailVerified: event.target.checked })} />
                Email verified
              </label>
            </div>
            <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit">
              <FiUserPlus />
              Create User
            </button>
          </form>
        </div>
      </Panel>

      <Panel title="Workspace Invitations" icon={<FiMail />} wide>
        <div className="stack">
          <div className="table-actions">
            <div className="table-filter">
              <span>Status</span>
              <select aria-label="Invitation status" value={invitationStatus} onChange={(event) => setInvitationStatus(event.target.value)}>
                {INVITATION_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <button className="secondary-button" disabled={action.pending || !context.workspaceId} onClick={loadWorkspaceSettings} type="button">
              <FiRefreshCw />
              Load
            </button>
          </div>

          <div className="table-wrap">
            {invitations.length === 0 ? (
              <EmptyState label="No invitations loaded" />
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td>{invitation.email || invitation.id}</td>
                      <td>{roleLabel(invitation)}</td>
                      <td><StatusPill active={invitation.status === 'pending'} label={invitation.status || 'unknown'} /></td>
                      <td>{formatTimestamp(invitation.expiresAt)}</td>
                      <td>
                        <button
                          className="secondary-button danger"
                          disabled={action.pending || !context.workspaceId || invitation.status !== 'pending'}
                          onClick={() => revokeInvitation(invitation)}
                          title="Revoke invitation"
                          type="button"
                        >
                          <FiSlash />
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <form className="stack nested-form" onSubmit={inviteUser}>
            <div className="two-column">
              <TextField label="Invitation email" value={invitationForm.email} onChange={(email) => setInvitationForm({ ...invitationForm, email })} />
              <TextField label="Workspace role ID" value={invitationForm.roleId} onChange={(roleId) => setInvitationForm({ ...invitationForm, roleId })} />
              <TextField label="Project ID" value={invitationForm.projectId} onChange={(projectId) => setInvitationForm({ ...invitationForm, projectId })} />
              <TextField label="Project role ID" value={invitationForm.projectRoleId} onChange={(projectRoleId) => setInvitationForm({ ...invitationForm, projectRoleId })} />
              <TextField label="Expires at ISO" value={invitationForm.expiresAt} onChange={(expiresAt) => setInvitationForm({ ...invitationForm, expiresAt })} />
            </div>
            <button className="primary-button" disabled={action.pending || !context.workspaceId} type="submit">
              <FiMail />
              Invite
            </button>
          </form>
        </div>
      </Panel>

      <Panel title="Workspace Management State" icon={<FiUsers />} wide>
        <ErrorLine message={action.error} />
        <div className="data-columns">
          <JsonPreview title="Members" value={members} />
          <JsonPreview title="Invitations" value={invitations} />
          <JsonPreview title="Last Result" value={lastResult} />
        </div>
      </Panel>
    </div>
  );
};

const compactRequest = (value) => Object.fromEntries(
  Object.entries(value)
    .map(([key, entry]) => [key, typeof entry === 'string' ? entry.trim() : entry])
    .filter(([, entry]) => entry !== ''),
);

const roleLabel = (record) => record.roleName || record.roleKey || record.roleId || 'Default';

const formatTimestamp = (value) => {
  if (!value) {
    return 'None';
  }
  return value.replace('T', ' ').replace(/\.\d+Z?$/, 'Z');
};
