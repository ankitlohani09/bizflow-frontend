import api from './api';

/**
 * staffService – Manage company employees and HR records
 *
 * API doc reference:
 *   GET    /staff         → list all staff members
 *   POST   /staff         → create staff record
 *   GET    /staff/{id}    → get single staff member
 *   PUT    /staff/{id}    → update staff member
 *   DELETE /staff/{id}    → delete staff member
 */
const staffService = {
    getAll() {
        return api.get('/staff');
    },

    getById(id) {
        return api.get(`/staff/${id}`);
    },

    create(staffData) {
        return api.post('/staff', staffData);
    },

    update(id, staffData) {
        return api.put(`/staff/${id}`, staffData);
    },

    delete(id) {
        return api.delete(`/staff/${id}`);
    },

    /** Toggle active status (assuming partial update) */
    toggleStatus(id, isActive) {
        return api.put(`/staff/${id}`, { isActive });
    }
};

export default staffService;
