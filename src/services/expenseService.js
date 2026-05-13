import api from './api';

/**
 * expenseService – financial expenses
 *
 * API doc reference:
 *   GET  /expenses            → list all expenses
 *   POST /expenses            → create expense
 *   GET  /expenses/{id}       → get expense by ID
 *   GET  /expenses/range      → get expenses by date range
 *   GET  /expense-categories  → list expense categories
 */
const expenseService = {
  /**
   * Fetch all expenses
   * @returns {Promise<Array>}
   */
  getAll() {
    return api.get('/expenses');
  },

  /**
   * Fetch expenses within a date range
   * @param {string} startDate – ISO date string e.g. "2026-01-01"
   * @param {string} endDate   – ISO date string e.g. "2026-04-30"
   * @returns {Promise<Array>}
   */
  getByRange(startDate, endDate) {
    return api.get('/expenses/range', { params: { startDate, endDate } });
  },

  /**
   * Get a single expense by ID
   * @param {string|number} id
   * @returns {Promise<object>}
   */
  getById(id) {
    return api.get(`/expenses/${id}`);
  },

  /**
   * Create a new expense
   * @param {object} expenseDto
   * @returns {Promise<object>}
   */
  create(expenseDto) {
    return api.post('/expenses', expenseDto);
  },

  /**
   * Fetch all expense categories
   * @returns {Promise<Array>}
   */
  getCategories() {
    return api.get('/expense-categories');
  },

  createCategory(categoryDto) {
    return api.post('/expense-categories', categoryDto);
  },
};

export default expenseService;
