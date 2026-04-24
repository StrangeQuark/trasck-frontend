import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
    mockAuthenticatedContext();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the product shell and primary routes without console controls', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Project management' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Backend URL')).not.toBeInTheDocument();
    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' });
    expect(primaryNavigation).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Work$/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Planning$/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Programs$/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Agents$/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Administration' })).toBeInTheDocument();
  });

  it('shows first-run setup links only while initial setup is available', async () => {
    fetch.mockImplementation(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes('/api/v1/setup/status')) {
        return new Response(JSON.stringify({ available: true, completed: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    render(<App />);

    expect(await screen.findByRole('link', { name: /First-run setup/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Setup$/i })).toBeInTheDocument();
  });

  it('hides first-run setup links after setup is completed', async () => {
    fetch.mockImplementation(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes('/api/v1/setup/status')) {
        return new Response(JSON.stringify({ available: false, completed: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    render(<App />);

    await waitFor(() => expect(fetch.mock.calls.some(([url]) => String(url).includes('/api/v1/setup/status'))).toBe(true));
    expect(screen.queryByRole('link', { name: /First-run setup/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Setup$/i })).not.toBeInTheDocument();
  });

  it.each([
    ['/programs', 'Program Portfolio'],
    ['/configuration/custom-fields/00000000-0000-0000-0000-000000000001', 'Custom Field Detail'],
    ['/configuration/screens/00000000-0000-0000-0000-000000000002', 'Screen Detail'],
    ['/planning/boards/00000000-0000-0000-0000-000000000003', 'Board Detail'],
    ['/automation/rules/00000000-0000-0000-0000-000000000004', 'Automation Rule Detail'],
    ['/imports/templates/00000000-0000-0000-0000-000000000005', 'Import Template Detail'],
    ['/imports/jobs/00000000-0000-0000-0000-000000000006', 'Import Job Detail'],
  ])('renders detail route %s', async (path, title) => {
    window.history.pushState({}, '', path);

    render(<App />);

    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
  });

  it('renders import conflict and materialization controls', async () => {
    window.history.pushState({}, '', '/imports');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Import Job' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Conflict Review' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: 'Rerun Snapshot' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: 'Record Review' }).length).toBeGreaterThan(0);
  });

  it('renders system administration controls', async () => {
    window.history.pushState({}, '', '/system');

    render(<App />);

    expect(await screen.findByRole('heading', { level: 2, name: 'System Admins' })).toBeInTheDocument();
  });

  it('renders project security policy controls', async () => {
    window.history.pushState({}, '', '/project-settings');
    mockAuthenticatedContext();

    render(<App />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Project Security Policy' })).toBeInTheDocument();
    const adminNavigation = screen.getByRole('navigation', { name: 'Administration' });
    expect(within(adminNavigation).getByRole('link', { name: /^System$/i })).toBeInTheDocument();
    expect(within(adminNavigation).getByRole('link', { name: /^Workspace$/i })).toBeInTheDocument();
    expect(within(adminNavigation).getByRole('link', { name: /^Project$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Public Preview/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Project Security State' })).toBeInTheDocument();
  });

  it('navigates to the homepage after successful first-run setup', async () => {
    window.history.pushState({}, '', '/setup');
    let setupCompleted = false;
    let loginCompleted = false;
    fetch.mockImplementation(async (url, init = {}) => {
      const requestUrl = String(url);
      const method = init.method || 'GET';
      if (requestUrl.includes('/api/v1/setup/status')) {
        return new Response(JSON.stringify({ available: !setupCompleted, completed: setupCompleted }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (requestUrl.includes('/api/v1/auth/csrf')) {
        return new Response(JSON.stringify({
          headerName: 'X-XSRF-TOKEN',
          parameterName: '_csrf',
          token: 'test-csrf-token',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (requestUrl.endsWith('/api/v1/setup') && method === 'POST') {
        setupCompleted = true;
        return new Response(JSON.stringify(firstSetupResponse()), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (requestUrl.includes('/api/v1/auth/login')) {
        loginCompleted = true;
        return new Response(JSON.stringify({
          user: authenticatedUser(),
          accessToken: 'test-access-token',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (requestUrl.includes('/api/v1/auth/context') && loginCompleted) {
        return new Response(JSON.stringify(authenticatedContext()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /Create/i }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Workspace' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
    expect(screen.queryByRole('link', { name: /First-run setup/i })).not.toBeInTheDocument();
  });

  it('shows account controls instead of the sign-in pane for authenticated sessions', async () => {
    window.history.pushState({}, '', '/auth');
    mockAuthenticatedContext();

    render(<App />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Account' })).toBeInTheDocument();
    expect(screen.getAllByText('Admin User').length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.queryByRole('heading', { level: 2, name: 'Sign In' })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Sign In' })).toBeInTheDocument();
  });

  it('renders workspace member management controls', async () => {
    window.history.pushState({}, '', '/workspace-settings');

    render(<App />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Workspace Security Policy' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Workspace Members' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Workspace Invitations' })).toBeInTheDocument();
  });

  it('renders anonymous public project preview route', async () => {
    window.history.pushState({}, '', '/public/projects/00000000-0000-0000-0000-000000000099');
    fetch.mockImplementation(async (url) => {
      const requestUrl = String(url);
      if (requestUrl.includes('/api/v1/public/projects/00000000-0000-0000-0000-000000000099/work-items/00000000-0000-0000-0000-000000000199/comments')) {
        return new Response(JSON.stringify([{
          id: '00000000-0000-0000-0000-000000000299',
          workItemId: '00000000-0000-0000-0000-000000000199',
          bodyMarkdown: 'Public collaboration note',
          createdAt: '2026-04-21T20:00:00Z',
        }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (requestUrl.includes('/api/v1/public/projects/00000000-0000-0000-0000-000000000099/work-items/00000000-0000-0000-0000-000000000199/attachments')) {
        return new Response(JSON.stringify([{
          id: '00000000-0000-0000-0000-000000000399',
          workItemId: '00000000-0000-0000-0000-000000000199',
          filename: 'public-notes.txt',
          contentType: 'text/plain',
          sizeBytes: 32,
          downloadUrl: '/api/v1/public/projects/00000000-0000-0000-0000-000000000099/work-items/00000000-0000-0000-0000-000000000199/attachments/00000000-0000-0000-0000-000000000399/download?token=test',
        }]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (requestUrl.endsWith('/api/v1/public/projects/00000000-0000-0000-0000-000000000099/work-items/00000000-0000-0000-0000-000000000199')) {
        return new Response(JSON.stringify({
          id: '00000000-0000-0000-0000-000000000199',
          projectId: '00000000-0000-0000-0000-000000000099',
          key: 'PTR-1',
          title: 'Public story',
          descriptionMarkdown: 'Visible work item',
          visibility: 'inherited',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (requestUrl.includes('/api/v1/public/projects/00000000-0000-0000-0000-000000000099/work-items')) {
        return new Response(JSON.stringify({
          items: [{
            id: '00000000-0000-0000-0000-000000000199',
            projectId: '00000000-0000-0000-0000-000000000099',
            key: 'PTR-1',
            title: 'Public story',
            visibility: 'inherited',
          }],
          nextCursor: null,
          hasMore: false,
          limit: 25,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (requestUrl.includes('/api/v1/public/projects/')) {
        return new Response(JSON.stringify({
          id: '00000000-0000-0000-0000-000000000099',
          workspaceId: '00000000-0000-0000-0000-000000000101',
          name: 'Public Trasck',
          key: 'PTR',
          description: 'Public project preview',
          visibility: 'public',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    render(<App />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Public Project Preview' })).toBeInTheDocument();
    expect(screen.getAllByText('Public Trasck').length).toBeGreaterThan(0);
    expect(screen.getByText('Public story')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Public story'));
    expect(await screen.findByText('Public collaboration note')).toBeInTheDocument();
    expect(screen.getByText('public-notes.txt')).toBeInTheDocument();
  });
});

const mockAuthenticatedContext = () => {
  fetch.mockImplementation(async (url) => {
    const requestUrl = String(url);
    if (requestUrl.includes('/api/v1/auth/csrf')) {
      return new Response(JSON.stringify({
        headerName: 'X-XSRF-TOKEN',
        parameterName: '_csrf',
        token: 'test-csrf-token',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (requestUrl.includes('/api/v1/auth/logout')) {
      return new Response(null, { status: 204 });
    }
    if (requestUrl.includes('/api/v1/auth/context')) {
      return new Response(JSON.stringify(authenticatedContext()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (requestUrl.includes('/api/v1/projects/00000000-0000-0000-0000-000000000099/security-policy')) {
      return new Response(JSON.stringify({
        projectId: '00000000-0000-0000-0000-000000000099',
        visibility: 'private',
        workspaceAnonymousReadEnabled: false,
        publicReadEnabled: false,
        customPolicy: false,
        workspaceCustomPolicy: false,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  });
};

const authenticatedUser = () => ({
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@example.test',
  username: 'admin',
  displayName: 'Admin User',
});

const authenticatedContext = () => ({
  user: authenticatedUser(),
  workspaces: [{
    id: '00000000-0000-0000-0000-000000000101',
    name: 'Demo Workspace',
    key: 'DEMO',
    status: 'active',
    permissionKeys: [
      'workspace.read',
      'workspace.admin',
      'report.read',
      'report.manage',
      'automation.admin',
      'user.manage',
      'agent.provider.manage',
      'agent.profile.manage',
      'repository_connection.manage',
    ],
  }],
  projects: [{
    id: '00000000-0000-0000-0000-000000000099',
    workspaceId: '00000000-0000-0000-0000-000000000101',
    name: 'Demo Project',
    key: 'DEMO',
    status: 'active',
    permissionKeys: [
      'project.read',
      'project.admin',
      'board.admin',
      'work_item.read',
      'work_item.create',
      'work_item.update',
      'work_item.comment',
      'work_item.link',
      'report.read',
      'report.manage',
    ],
  }],
  defaultWorkspace: {
    id: '00000000-0000-0000-0000-000000000101',
    name: 'Demo Workspace',
    key: 'DEMO',
    status: 'active',
    permissionKeys: [
      'workspace.read',
      'workspace.admin',
      'report.read',
      'report.manage',
      'automation.admin',
      'user.manage',
      'agent.provider.manage',
      'agent.profile.manage',
      'repository_connection.manage',
    ],
  },
  defaultProject: {
    id: '00000000-0000-0000-0000-000000000099',
    workspaceId: '00000000-0000-0000-0000-000000000101',
    name: 'Demo Project',
    key: 'DEMO',
    status: 'active',
    permissionKeys: [
      'project.read',
      'project.admin',
      'board.admin',
      'work_item.read',
      'work_item.create',
      'work_item.update',
      'work_item.comment',
      'work_item.link',
      'report.read',
      'report.manage',
    ],
  },
  systemAdmin: true,
});

const firstSetupResponse = () => ({
  adminUser: authenticatedUser(),
  organization: {
    id: '00000000-0000-0000-0000-000000000201',
    name: 'Demo Organization',
    slug: 'demo-organization',
  },
  workspace: authenticatedContext().defaultWorkspace,
  project: authenticatedContext().defaultProject,
  seedData: {},
});
