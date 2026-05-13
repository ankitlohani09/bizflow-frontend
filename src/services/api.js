import axios from 'axios';

/**
 * Centralized Axios instance for BizFlow API
 *
 * API prefix (/api/v1) is declared here so services only write the path (e.g. /invoices)
 *
 * What this file does automatically:
 *  1. Reads the JWT from localStorage and adds "Authorization: Bearer <token>" to every request
 *  2. Unwraps the standard backend envelope { success, message, data } → returns data directly
 *  3. On 401 clears the stored token (session expired)
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // use env var with fallback
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15-second timeout
});

// ── Request interceptor ────────────────────────────────────────────────────────
// Runs before every outgoing request; attaches the Bearer token when it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────────────────
// Runs after every response; unwraps { success, message, data } so callers
// receive "data" directly without needing response.data.data everywhere
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    // Backend envelope: { success: true, message: "...", data: <payload> }
    if (body && body.data !== undefined) {
      return body.data;
    }
    // Fallback for endpoints that don't use the envelope
    return body;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[BizFlow] Unauthorized – clearing session');
      localStorage.removeItem('token');
      // Redirect to login; using location.href because we are outside React here
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Provide a human-readable message so UI can display it
    const message =
      error.response?.data?.message ||
      error.response?.data?.error || // Some Spring Boot errors use 'error' field
      error.message ||
      'An unexpected server error occurred';

    // Create an error object that carries the full response for debugging
    const enrichedError = new Error(message);
    enrichedError.response = error.response;
    return Promise.reject(enrichedError);
  }
);

export default api;
