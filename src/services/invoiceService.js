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
const cache = {
  all: null,
  byId: {}
};

const invoiceService = {
  /**
   * Fetch all invoices.
   * Returns the unwrapped array directly (api.js handles the envelope).
   * @returns {Promise<Array>}
   */
  getAll() {
    if (cache.all) {
      return cache.all;
    }
    const promise = api.get('/invoices');
    cache.all = promise;
    
    promise.catch(() => {
      cache.all = null;
    });
    
    return promise;
  },

  /**
   * Fetch a single invoice by ID
   * @param {string|number} id
   * @returns {Promise<object>}
   */
  getById(id) {
    if (cache.byId[id]) {
      return cache.byId[id];
    }
    const promise = api.get(`/invoices/${id}`);
    cache.byId[id] = promise;
    
    promise.catch(() => {
      delete cache.byId[id];
    });
    
    return promise;
  },

  /**
   * Create a new invoice
   * @param {object} invoiceDto – InvoiceDto from API spec
   * @returns {Promise<object>}
   */
  create(invoiceDto) {
    cache.all = null; // Invalidate list cache
    return api.post('/invoices', invoiceDto);
  },

  /**
   * Add a payment to an existing invoice
   * @param {string|number} id
   * @param {object} paymentDto
   * @returns {Promise<object>}
   */
  addPayment(id, paymentDto) {
    delete cache.byId[id]; // Invalidate detail cache
    cache.all = null; // Invalidate list cache as payment status changes
    return api.post(`/invoices/${id}/payments`, paymentDto);
  },
};

export default invoiceService;
