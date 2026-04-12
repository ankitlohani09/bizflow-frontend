import api from './api';

/**
 * purchaseService – Procurement and stock replenishment
 *
 * API doc reference:
 *   GET    /purchases         → list all purchases
 *   POST   /purchases         → record new purchase
 *   GET    /purchases/{id}    → get purchase details
 *   PUT    /purchases/{id}    → update purchase status
 */
const purchaseService = {
  getAll() {
    return api.get('/purchases');
  },

  getById(id) {
    return api.get(`/purchases/${id}`);
  },

  create(purchaseData) {
    return api.post('/purchases', purchaseData);
  },

  updateStatus(id, status) {
    return api.put(`/purchases/${id}`, { status });
  },

  delete(id) {
    return api.delete(`/purchases/${id}`);
  },
};

export default purchaseService;
