import api from './api';

/**
 * paymentModeService – manage payment modes for billing
 *
 * API doc reference:
 *   GET    /payment-modes          → list all active payment modes
 *   POST   /payment-modes          → create payment mode
 *   PUT    /payment-modes/{id}     → update payment mode
 *   DELETE /payment-modes/{id}     → delete payment mode
 *
 * PaymentModeDto shape:
 *   { id, name, isActive }
 */
const paymentModeService = {
    /**
     * Fetch all payment modes
     * @returns {Promise<Array>}
     */
    getAll() {
        return api.get('/payment-modes');
    },

    /**
     * Create a new payment mode
     * @param {{ name: string, isActive?: boolean }} dto
     * @returns {Promise<object>}
     */
    create(dto) {
        return api.post('/payment-modes', dto);
    },

    /**
     * Update an existing payment mode
     * @param {string|number} id
     * @param {{ name: string, isActive?: boolean }} dto
     * @returns {Promise<object>}
     */
    update(id, dto) {
        return api.put(`/payment-modes/${id}`, dto);
    },

    /**
     * Delete a payment mode
     * @param {string|number} id
     * @returns {Promise<void>}
     */
    delete(id) {
        return api.delete(`/payment-modes/${id}`);
    },
};

export default paymentModeService;
