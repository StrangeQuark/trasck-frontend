export const createAuthService = (api) => ({
  setup(request) {
    return api.request('post', '/api/v1/setup', { body: request });
  },

  setupStatus() {
    return api.request('get', '/api/v1/setup/status');
  },

  login(request) {
    return api.request('post', '/api/v1/auth/login', { body: request });
  },

  csrf() {
    return api.request('get', '/api/v1/auth/csrf');
  },

  me() {
    return api.request('get', '/api/v1/auth/me');
  },

  context() {
    return api.request('get', '/api/v1/auth/context');
  },

  logout() {
    return api.request('post', '/api/v1/auth/logout', { responseType: 'void' });
  },

  listPersonalTokens() {
    return api.request('get', '/api/v1/auth/tokens/personal');
  },

  createPersonalToken(request) {
    return api.request('post', '/api/v1/auth/tokens/personal', { body: request });
  },

  revokePersonalToken(tokenId) {
    return api.request('delete', '/api/v1/auth/tokens/{tokenId}', {
      path: { tokenId },
      responseType: 'void',
    });
  },

  listServiceTokens(workspaceId) {
    return api.request('get', '/api/v1/workspaces/{workspaceId}/service-tokens', {
      path: { workspaceId },
    });
  },

  createServiceToken(workspaceId, request) {
    return api.request('post', '/api/v1/workspaces/{workspaceId}/service-tokens', {
      path: { workspaceId },
      body: request,
    });
  },

  revokeServiceToken(workspaceId, tokenId) {
    return api.request('delete', '/api/v1/workspaces/{workspaceId}/service-tokens/{tokenId}', {
      path: { workspaceId, tokenId },
      responseType: 'void',
    });
  },
});
