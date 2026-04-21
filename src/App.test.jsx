import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      },
    )));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the project console shell and primary routes', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Project Console' })).toBeInTheDocument();
    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' });
    expect(primaryNavigation).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Work$/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Planning$/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Programs$/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Agents$/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^System$/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Workspace$/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /^Project$/i })).toBeInTheDocument();
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
    window.localStorage.setItem('trasck.projectId', '00000000-0000-0000-0000-000000000099');

    render(<App />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Project Security Policy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Public Preview/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Project Security State' })).toBeInTheDocument();
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
    expect(screen.getByText('Public Trasck')).toBeInTheDocument();
    expect(screen.getByText('Public story')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Public story'));
    expect(await screen.findByText('Public collaboration note')).toBeInTheDocument();
    expect(screen.getByText('public-notes.txt')).toBeInTheDocument();
  });
});
