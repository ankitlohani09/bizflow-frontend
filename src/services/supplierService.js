import api from './api';

/**
 * supplierService – Vendor and supply chain management
 *
 * API doc reference:
 *   GET    /suppliers         → list all suppliers
 *   POST   /suppliers         → create supplier
 *   GET    /suppliers/{id}    → get supplier by ID
 *   PUT    /suppliers/{id}    → update supplier
 *   DELETE /suppliers/{id}    → delete supplier
 */
const supplierService = {
  getAll() {
    return api.get('/suppliers');
  },

  getById(id) {
    return api.get(`/suppliers/${id}`);
  },

  create(supplierData) {
    return api.post('/suppliers', supplierData);
  },

  update(id, supplierData) {
    return api.put(`/suppliers/${id}`, supplierData);
  },

  delete(id) {
    return api.delete(`/suppliers/${id}`);
  },
};

export default supplierService;
