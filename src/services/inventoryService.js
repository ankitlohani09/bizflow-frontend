import api from './api';

/**
 * inventoryService – stock and inventory management
 *
 * API doc reference:
 *   GET   /inventory                      → list all inventory records
 *   GET   /inventory/{id}                 → get inventory by ID
 *   PATCH /inventory/{id}/threshold       → update low-stock threshold
 *   GET   /stock-movements                → list stock movements
 *   POST  /stock-movements                → create stock adjustment
 *
 * Inventory record shape (InventoryDto):
 *   { id, itemId, availableQty, damagedQty, expiredQty, lowStockThreshold, ... }
 */
const cache = {
  all: null,
  byId: {}
};

const inventoryService = {
  /**
   * Fetch all inventory records
   * @returns {Promise<Array>}
   */
  getAll() {
    if (cache.all) {
      return cache.all;
    }
    const promise = api.get('/inventory');
    cache.all = promise;
    
    promise.catch(() => {
      cache.all = null;
    });
    
    return promise;
  },

  /**
   * Fetch a single inventory record
   * @param {string|number} id
   * @returns {Promise<object>}
   */
  getById(id) {
    if (cache.byId[id]) {
      return cache.byId[id];
    }
    const promise = api.get(`/inventory/${id}`);
    cache.byId[id] = promise;
    
    promise.catch(() => {
      delete cache.byId[id];
    });
    
    return promise;
  },

  /**
   * Update the low-stock threshold for an item
   * @param {string|number} id
   * @param {number} threshold
   * @returns {Promise<object>}
   */
  updateThreshold(id, threshold) {
    delete cache.byId[id]; // Invalidate detail cache
    cache.all = null; // Invalidate list cache
    return api.patch(`/inventory/${id}/threshold`, { threshold });
  },

  /**
   * Fetch stock movement history
   * @returns {Promise<Array>}
   */
  getStockMovements() {
    return api.get('/stock-movements');
  },

  /**
   * Create a stock adjustment (e.g. manual correction)
   * @param {object} adjustmentDto
   * @returns {Promise<object>}
   */
  createStockMovement(adjustmentDto) {
    cache.all = null; // Invalidate list cache as stock changes
    return api.post('/stock-movements', adjustmentDto);
  },

  /**
   * Fetch stock movements for a specific item
   * @param {string|number} itemId
   * @returns {Promise<Array>}
   */
  getMovementsByItem(itemId) {
    return api.get(`/stock-movements/item/${itemId}`);
  },
};

export default inventoryService;
