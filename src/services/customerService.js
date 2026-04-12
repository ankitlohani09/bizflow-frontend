import api from './api';

/**
 * customerService – CRUD operations against the BizFlow Customer API
 *
 * API doc reference:
 *   GET    /customers         → list all customers
 *   POST   /customers         → create a customer
 *   GET    /customers/{id}    → get single customer
 *   PUT    /customers/{id}    → update customer
 *   DELETE /customers/{id}    → delete customer
 *
 * All responses are automatically unwrapped by api.js interceptor,
 * so we receive the `data` payload directly.
 *
 * Customer shape (CustomerRequest from API docs):
 *   { name, email, phone, address, city, state, openingBalance }
 *   `name` is the only required field.
 */
const customerService = {
    /** Fetch all customers */
    getAll() {
        return api.get('/customers');
    },

    /** Fetch a single customer by ID */
    getById(id) {
        return api.get(`/customers/${id}`);
    },

    /**
     * Create a new customer
     * @param {object} customerData – must include `name`
     */
    create(customerData) {
        return api.post('/customers', customerData);
    },

    /**
     * Update an existing customer
     * @param {string|number} id
     * @param {object} customerData
     */
    update(id, customerData) {
        return api.put(`/customers/${id}`, customerData);
    },

    /**
     * Delete a customer by ID
     * @param {string|number} id
     */
    delete(id) {
        return api.delete(`/customers/${id}`);
    },
};

export default customerService;
