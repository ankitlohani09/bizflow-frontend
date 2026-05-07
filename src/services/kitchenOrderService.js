import api from './api';

/**
 * kitchenOrderService – handles restaurant kitchen orders
 * 
 * Endpoints:
 *   GET /kitchen-orders
 *   GET /kitchen-orders/{id}
 *   POST /kitchen-orders
 *   PATCH /kitchen-orders/{id}/status
 */
const kitchenOrderService = {
  /**
   * Get all kitchen orders with optional status filter
   */
  getAll: async (status) => {
    const params = status ? { status } : {};
    return api.get('/kitchen-orders', { params });
  },

  /**
   * Get a single order by ID
   */
  getById: async (id) => {
    return api.get(`/kitchen-orders/${id}`);
  },

  /**
   * Create a new kitchen order
   */
  create: async (orderRequest) => {
    return api.post('/kitchen-orders', orderRequest);
  },

  /**
   * Update the status of a kitchen order
   * @param {number} id 
   * @param {string} status - PENDING, PREPARING, READY, DELIVERED, CANCELLED
   */
  updateStatus: async (id, status) => {
    return api.patch(`/kitchen-orders/${id}/status`, null, {
      params: { status }
    });
  }
};

export default kitchenOrderService;
