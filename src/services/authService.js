import api from './api';

/**
 * authService – handles login, logout, and token storage
 *
 * API doc reference:
 *   POST /auth/login
 *   Body: { email, password, tenantId? }
 *   Response envelope: { success, message, data: { token, ... } }
 *
 * The api.js interceptor unwraps the envelope, so we receive data.token directly.
 */
const authService = {
  /**
   * Log in a user with email + password.
   * On success, stores the JWT token in localStorage.
   *
   * @param {string} email
   * @param {string} password
   * @param {string} [tenantId]
   * @returns {Promise<object>} – resolved LoginResponse data
   */
  async login(email, password, tenantId) {
    const payload = { email, password };
    if (tenantId) payload.tenantId = tenantId;

    // api.js interceptor: response.data.data is automatically unwrapped
    // so `result` here = the LoginResponse data object which contains { token, ... }
    const result = await api.post('/auth/login', payload);

    if (result?.token) {
      localStorage.setItem('token', result.token);
    }

    return result;
  },

  /**
   * Log out: remove token from storage
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Returns true if a JWT token exists in storage
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Returns the raw token string
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('token');
  },
};

export default authService;
