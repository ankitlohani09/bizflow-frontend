import api from './api';

/**
 * returnService – handle product returns and inventory restoration
 * 
 * Concept: Every return must be tied to an original Invoice item.
 */
const returnService = {
  /**
   * Process a return for an invoice
   * @param {object} payload - { invoiceId, itemId, quantity, condition, reason }
   */
  async processReturn(payload) {
    // 1. Log the return in the billing system
    // 2. The backend should automatically trigger a Stock Movement in Inventory
    return api.post('/returns', payload);
  },

  /**
   * Fetch return history for a specific business
   */
  getReturnHistory() {
    return api.get('/returns');
  },

  /**
   * Fetch a specific return by ID
   */
  getById(id) {
    return api.get(`/returns/${id}`);
  },

  approve(id, overrideRefund) {
    return api.post(`/returns/${id}/approve`, null, { params: { overrideRefund } });
  },

  reject(id, reason) {
    return api.post(`/returns/${id}/reject`, null, { params: { reason } });
  }
};

export default returnService;
