import api from './api';

/**
 * itemService – manage inventory items / products
 *
 * API doc reference:
 *   GET    /items          → list all items
 *   POST   /items          → create item
 *   GET    /items/{id}     → get single item
 *   PUT    /items/{id}     → update item
 *   DELETE /items/{id}     → delete item
 */
const itemService = {
    getAll() {
        return api.get('/items');
    },

    getById(id) {
        return api.get(`/items/${id}`);
    },

    create(itemData) {
        return api.post('/items', itemData);
    },

    update(id, itemData) {
        return api.put(`/items/${id}`, itemData);
    },

    delete(id) {
        return api.delete(`/items/${id}`);
    },
};

export default itemService;
