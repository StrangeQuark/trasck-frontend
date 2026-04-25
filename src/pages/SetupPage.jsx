import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiDatabase } from 'react-icons/fi';
import { ErrorLine } from '../components/ErrorLine';
import { Panel } from '../components/Panel';
import { TextField } from '../components/TextField';
import { defaultSetupForm } from '../constants/appConstants';
import { useApiAction } from '../hooks/useApiAction';

const STEPS = [
  { key: 'admin', label: 'Super admin' },
  { key: 'organization', label: 'Organization' },
  { key: 'workspace', label: 'Workspace' },
  { key: 'team', label: 'Team' },
  { key: 'project', label: 'Project' },
];

export const SetupPage = ({ context }) => {
  const [form, setForm] = useState(defaultSetupForm);
  const [step, setStep] = useState(context.currentUser && !context.setupAvailable ? 'organization' : 'admin');
  const [setupResult, setSetupResult] = useState({});
  const navigate = useNavigate();
  const action = useApiAction(context.addToast);

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  const finish = async () => {
    await context.refreshSession?.();
    context.setSetupAvailable?.(false);
    navigate('/', { replace: true });
  };

  const submitAdmin = async (event) => {
    event.preventDefault();
    const created = await action.run(async () => {
      const setup = await context.services.auth.setup({
        adminUser: {
          email: form.email,
          username: form.username,
          displayName: form.displayName,
          password: form.password,
        },
      });
      const session = await context.services.auth.login({
        identifier: form.email,
        password: form.password,
      });
      context.setCurrentUser(session?.user || null);
      context.setSetupAvailable?.(false);
      await context.refreshSession?.();
      return setup;
    }, 'Super admin created');

    if (created) {
      setSetupResult((current) => ({ ...current, adminUser: created.adminUser }));
      setStep('organization');
    }
  };

  const submitOrganization = async (event) => {
    event.preventDefault();
    const organization = await action.run(() => context.services.organizations.createOrganization({
      name: form.organizationName,
      slug: form.organizationSlug,
      status: 'active',
    }), 'Organization created');

    if (organization) {
      setSetupResult((current) => ({ ...current, organization }));
      setStep('workspace');
    }
  };

  const submitWorkspace = async (event) => {
    event.preventDefault();
    const organizationId = setupResult.organization?.id;
    const workspace = await action.run(async () => {
      const created = await context.services.organizations.createWorkspace(organizationId, {
        name: form.workspaceName,
        key: form.workspaceKey,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        locale: navigator.language || 'en-US',
        anonymousReadEnabled: false,
        status: 'active',
      });
      const refreshed = await context.refreshSession?.();
      context.setWorkspaceId(created?.id || refreshed?.defaultWorkspace?.id || '');
      return created;
    }, 'Workspace created');

    if (workspace) {
      setSetupResult((current) => ({ ...current, workspace }));
      setStep('team');
    }
  };

  const submitTeam = async (event) => {
    event.preventDefault();
    const workspaceId = setupResult.workspace?.id;
    const team = await action.run(() => context.services.planning.createTeam(workspaceId, {
      name: form.teamName,
      defaultCapacity: 100,
      status: 'active',
    }), 'Team created');

    if (team) {
      setSetupResult((current) => ({ ...current, team }));
      setStep('project');
    }
  };

  const submitProject = async (event) => {
    event.preventDefault();
    const workspaceId = setupResult.workspace?.id;
    const project = await action.run(async () => {
      const created = await context.services.projects.createProject(workspaceId, {
        name: form.projectName,
        key: form.projectKey,
        visibility: 'private',
        status: 'active',
      });
      if (setupResult.team?.id) {
        await context.services.planning.assignProjectTeam(created.id, setupResult.team.id, { role: 'delivery' });
      }
      const refreshed = await context.refreshSession?.();
      context.setWorkspaceId(workspaceId || refreshed?.defaultWorkspace?.id || '');
      context.setProjectId(created?.id || refreshed?.defaultProject?.id || '');
      return created;
    }, 'Project created');

    if (project) {
      setSetupResult((current) => ({ ...current, project }));
      setStep('done');
    }
  };

  return (
    <div className="content-grid">
      <Panel title="Initial Setup" icon={<FiDatabase />} wide>
        <SetupProgress currentStep={step} />
        {step === 'admin' && (
          <form className="stack" onSubmit={submitAdmin}>
            <div className="two-column">
              <TextField label="Admin email" value={form.email} onChange={(email) => updateForm({ email })} />
              <TextField label="Username" value={form.username} onChange={(username) => updateForm({ username })} />
              <TextField label="Display name" value={form.displayName} onChange={(displayName) => updateForm({ displayName })} />
              <TextField label="Password" type="password" value={form.password} onChange={(password) => updateForm({ password })} />
            </div>
            <button className="primary-button" disabled={action.pending || !form.email || !form.username || !form.displayName || !form.password} type="submit">
              <FiArrowRight />
              Create super admin
            </button>
            <ErrorLine message={action.error} />
          </form>
        )}

        {step === 'organization' && (
          <form className="stack" onSubmit={submitOrganization}>
            <div className="two-column">
              <TextField label="Organization name" value={form.organizationName} onChange={(organizationName) => updateForm({ organizationName })} />
              <TextField label="Organization slug" value={form.organizationSlug} onChange={(organizationSlug) => updateForm({ organizationSlug })} />
            </div>
            <StepActions
              disabled={action.pending || !form.organizationName || !form.organizationSlug}
              onSkip={finish}
              pending={action.pending}
              submitLabel="Create organization"
            />
            <ErrorLine message={action.error} />
          </form>
        )}

        {step === 'workspace' && (
          <form className="stack" onSubmit={submitWorkspace}>
            <div className="two-column">
              <TextField label="Workspace name" value={form.workspaceName} onChange={(workspaceName) => updateForm({ workspaceName })} />
              <TextField label="Workspace key" value={form.workspaceKey} onChange={(workspaceKey) => updateForm({ workspaceKey: workspaceKey.toUpperCase() })} />
            </div>
            <StepActions
              disabled={action.pending || !setupResult.organization?.id || !form.workspaceName || !form.workspaceKey}
              onSkip={finish}
              pending={action.pending}
              submitLabel="Create workspace"
            />
            <ErrorLine message={action.error} />
          </form>
        )}

        {step === 'team' && (
          <form className="stack" onSubmit={submitTeam}>
            <TextField label="Team name" value={form.teamName} onChange={(teamName) => updateForm({ teamName })} />
            <StepActions
              disabled={action.pending || !setupResult.workspace?.id || !form.teamName}
              onSkip={finish}
              pending={action.pending}
              submitLabel="Create team"
            />
            <ErrorLine message={action.error} />
          </form>
        )}

        {step === 'project' && (
          <form className="stack" onSubmit={submitProject}>
            <div className="two-column">
              <TextField label="Project name" value={form.projectName} onChange={(projectName) => updateForm({ projectName })} />
              <TextField label="Project key" value={form.projectKey} onChange={(projectKey) => updateForm({ projectKey: projectKey.toUpperCase() })} />
            </div>
            <StepActions
              disabled={action.pending || !setupResult.workspace?.id || !form.projectName || !form.projectKey}
              onSkip={finish}
              pending={action.pending}
              submitLabel="Create project"
            />
            <ErrorLine message={action.error} />
          </form>
        )}

        {step === 'done' && (
          <div className="stack">
            <p className="success-text">Your starter workspace is ready.</p>
            <button className="primary-button" onClick={finish} type="button">
              <FiArrowRight />
              Open workspace
            </button>
          </div>
        )}
      </Panel>

      <Panel title="Setup status" icon={<FiCheckCircle />}>
        <div className="stack">
          <p className="muted">Only the super admin account is required. Each later step creates normal product records through authenticated APIs.</p>
          <dl className="summary-rows">
            <SummaryRow label="Admin" value={displayName(setupResult.adminUser)} />
            <SummaryRow label="Organization" value={setupResult.organization?.name} />
            <SummaryRow label="Workspace" value={setupResult.workspace?.name} />
            <SummaryRow label="Team" value={setupResult.team?.name} />
            <SummaryRow label="Project" value={projectName(setupResult.project)} />
          </dl>
        </div>
      </Panel>
    </div>
  );
};

const SetupProgress = ({ currentStep }) => (
  <ol className="setup-progress" aria-label="Setup progress">
    {STEPS.map((item) => (
      <li key={item.key} className={item.key === currentStep ? 'active' : completedStep(item.key, currentStep) ? 'complete' : ''}>
        <span>{item.label}</span>
      </li>
    ))}
  </ol>
);

const StepActions = ({ disabled, onSkip, pending, submitLabel }) => (
  <div className="button-row wrap">
    <button className="primary-button" disabled={disabled} type="submit">
      <FiArrowRight />
      {submitLabel}
    </button>
    <button className="secondary-button" disabled={pending} onClick={onSkip} type="button">
      Skip for now
    </button>
  </div>
);

const SummaryRow = ({ label, value }) => (
  <div>
    <dt>{label}</dt>
    <dd>{value || 'Not created'}</dd>
  </div>
);

const displayName = (user) => user?.displayName || user?.username || user?.email;

const projectName = (project) => {
  if (!project) {
    return '';
  }
  return project.key ? `${project.key} - ${project.name}` : project.name;
};

const completedStep = (step, currentStep) => {
  const currentIndex = STEPS.findIndex((item) => item.key === currentStep);
  const stepIndex = STEPS.findIndex((item) => item.key === step);
  return currentIndex > stepIndex || currentStep === 'done';
};
