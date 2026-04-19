export const createAuthService = (api) => ({
  setup(request) {
    return api.request('post', '/api/v1/setup', { body: request });
  },

  login(request) {
    return api.request('post', '/api/v1/auth/login', { body: request });
  },

  me() {
    return api.request('get', '/api/v1/auth/me');
  },

  logout() {
    return api.request('post', '/api/v1/auth/logout', { responseType: 'void' });
  },
});
