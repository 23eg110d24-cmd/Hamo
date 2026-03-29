/**
 * Base API client for the frontend.
 * Handles URL joining, JSON parsing, token refresh, and common response wrappers.
 */

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || '/api');

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

async function request(endpoint, options = {}) {
  const {
    body,
    headers: customHeaders = {},
    params,
    retryOnUnauthorized = true,
    ...fetchOptions
  } = options;

  const token = localStorage.getItem('token');
  const headers = {
    Accept: 'application/json',
    ...customHeaders,
  };

  let requestBody = body;

  if (requestBody !== undefined && requestBody !== null && !(requestBody instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    if (headers['Content-Type'] === 'application/json' && typeof requestBody !== 'string') {
      requestBody = JSON.stringify(requestBody);
    }
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = buildUrl(endpoint, params);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      body: requestBody,
      credentials: fetchOptions.credentials || 'include',
      headers,
    });

    if ((response.status === 401 || response.status === 403) && retryOnUnauthorized && !String(endpoint).includes('/auth/refresh')) {
      const refreshed = await attemptTokenRefresh();

      if (refreshed) {
        return request(endpoint, {
          ...options,
          retryOnUnauthorized: false,
        });
      }

      clearAuthSession();
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw new Error(response.status === 403 ? 'Forbidden' : 'Unauthorized');
    }

    const payload = await parseResponse(response);

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload, response.status));
    }

    return unwrapPayload(payload);
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => '');
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function attemptTokenRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return false;
  }

  try {
    const refreshResponse = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      return false;
    }

    const payload = unwrapPayload(await parseResponse(refreshResponse));
    const nextToken = payload?.token || payload?.accessToken || payload?.jwt;
    const nextRefreshToken = payload?.refreshToken || payload?.refresh_token;

    if (!nextToken) {
      return false;
    }

    localStorage.setItem('token', nextToken);
    if (nextRefreshToken) {
      localStorage.setItem('refreshToken', nextRefreshToken);
    }

    return true;
  } catch {
    return false;
  }
}

function buildUrl(endpoint, params) {
  const normalizedEndpoint = String(endpoint || '');
  const isAbsoluteEndpoint = normalizedEndpoint.startsWith('http');
  const isAbsoluteBaseUrl = /^https?:\/\//i.test(API_BASE_URL);
  const url = isAbsoluteEndpoint
    ? new URL(normalizedEndpoint)
    : new URL(joinPaths(API_BASE_URL, normalizedEndpoint), isAbsoluteBaseUrl ? undefined : window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item));
        return;
      }

      url.searchParams.set(key, value);
    });
  }

  return isAbsoluteEndpoint || isAbsoluteBaseUrl
    ? url.toString()
    : `${url.pathname}${url.search}${url.hash}`;
}

function joinPaths(base, endpoint) {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${normalizedBase}${normalizedEndpoint}`;
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    return '/api';
  }

  return String(baseUrl).replace(/\/+$/, '') || '/api';
}

function unwrapPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  if ('data' in payload && payload.data !== undefined && payload.data !== null) {
    return payload.data;
  }

  return payload;
}

function extractErrorMessage(payload, status) {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    return (
      payload.message ||
      payload.error ||
      payload.details ||
      payload.title ||
      `API Error: ${status}`
    );
  }

  return `API Error: ${status}`;
}

function clearAuthSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}
