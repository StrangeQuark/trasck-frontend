import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTrasckApiClient } from './client';

describe('createTrasckApiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches a fresh csrf token for each unsafe request', async () => {
    let csrfCounter = 0;
    const requestTokens = [];

    fetch.mockImplementation(async (url, init = {}) => {
      const requestUrl = String(url);
      if (requestUrl.endsWith('/api/v1/auth/csrf')) {
        csrfCounter += 1;
        return new Response(JSON.stringify({
          token: `csrf-token-${csrfCounter}`,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      requestTokens.push(new Headers(init.headers).get('X-XSRF-TOKEN'));
      return new Response(JSON.stringify({
        accessToken: 'session-token',
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@example.com',
          username: 'admin',
          displayName: 'Admin',
          active: true,
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const client = createTrasckApiClient({ baseUrl: 'http://localhost:6100' });

    await client.request('post', '/api/v1/auth/login', {
      body: { identifier: 'admin', password: 'password' },
    });
    await client.request('post', '/api/v1/auth/login', {
      body: { identifier: 'admin', password: 'password' },
    });

    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/api/v1/auth/csrf'))).toHaveLength(2);
    expect(requestTokens).toEqual(['csrf-token-1', 'csrf-token-2']);
  });
});
