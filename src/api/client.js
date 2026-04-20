import { TrasckApiClient } from './generated/trasckApi';

export const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_TRASCK_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:6100';

export const createTrasckApiClient = ({ baseUrl } = {}) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl || DEFAULT_API_BASE_URL);
  const csrfTokenProvider = createCsrfTokenProvider(normalizedBaseUrl);
  return new TrasckApiClient({
    baseUrl: normalizedBaseUrl,
    credentials: 'include',
    getCsrfToken: csrfTokenProvider,
  });
};

export const normalizeBaseUrl = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

export const apiErrorMessage = (error) => {
  if (!error) {
    return 'Request failed';
  }
  const body = error.body;
  if (body && typeof body === 'object') {
    return body.message || body.error || body.detail || error.message || 'Request failed';
  }
  if (typeof body === 'string' && body.trim()) {
    return body;
  }
  return error.message || 'Request failed';
};

const createCsrfTokenProvider = (baseUrl) => {
  let cachedToken = '';

  return async () => {
    if (cachedToken) {
      return cachedToken;
    }
    const response = await fetch(new URL('/api/v1/auth/csrf', baseUrl).toString(), {
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      return undefined;
    }
    const body = await response.json();
    cachedToken = body?.token || body?.csrfToken?.token || '';
    return cachedToken || undefined;
  };
};
