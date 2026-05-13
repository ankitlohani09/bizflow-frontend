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
const inventoryService = {
  /**
   * Fetch all inventory records
   * @returns {Promise<Array>}
   */
  getAll() {
    return api.get('/inventory');
  },

  /**
   * Fetch a single inventory record
   * @param {string|number} id
   * @returns {Promise<object>}
   */
  getById(id) {
    return api.get(`/inventory/${id}`);
  },

  /**
   * Update the low-stock threshold for an item
   * @param {string|number} id
   * @param {number} threshold
   * @returns {Promise<object>}
   */
  updateThreshold(id, threshold) {
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
