import api from './api';

/**
 * invoiceService – sales / invoices from the BizFlow backend
 *
 * API doc reference:
 *   GET  /invoices         → list all invoices
 *   POST /invoices         → create invoice
 *   GET  /invoices/{id}    → get single invoice
 *   POST /invoices/{id}/payments → add payment to invoice
 */
const invoiceService = {
  /**
   * Fetch all invoices.
   * Returns the unwrapped array directly (api.js handles the envelope).
   * @returns {Promise<Array>}
   */
  getAll() {
    return api.get('/invoices');
  },

  /**
   * Fetch a single invoice by ID
   * @param {string|number} id
   * @returns {Promise<object>}
   */
  getById(id) {
    return api.get(`/invoices/${id}`);
  },

  /**
   * Create a new invoice
   * @param {object} invoiceDto – InvoiceDto from API spec
   * @returns {Promise<object>}
   */
  create(invoiceDto) {
    return api.post('/invoices', invoiceDto);
  },

  /**
   * Add a payment to an existing invoice
   * @param {string|number} id
   * @param {object} paymentDto
   * @returns {Promise<object>}
   */
  addPayment(id, paymentDto) {
    return api.post(`/invoices/${id}/payments`, paymentDto);
  },
};

export default invoiceService;
