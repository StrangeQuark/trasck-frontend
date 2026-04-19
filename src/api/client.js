import { TrasckApiClient } from './generated/trasckApi';

export const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_TRASCK_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:6100';

export const createTrasckApiClient = ({ baseUrl, accessToken } = {}) => new TrasckApiClient({
  baseUrl: normalizeBaseUrl(baseUrl || DEFAULT_API_BASE_URL),
  credentials: 'include',
  getAccessToken: () => accessToken || undefined,
});

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
