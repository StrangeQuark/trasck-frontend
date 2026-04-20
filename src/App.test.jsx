import { render, screen, within } from '@testing-library/react';
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
    expect(within(primaryNavigation).getByRole('link', { name: /Work/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /Planning/i })).toBeInTheDocument();
    expect(within(primaryNavigation).getByRole('link', { name: /Agents/i })).toBeInTheDocument();
  });

  it.each([
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
  });
});
