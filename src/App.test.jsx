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
});
