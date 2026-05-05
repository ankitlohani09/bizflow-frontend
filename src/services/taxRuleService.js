import api from './api';

const taxRuleService = {
    getAll: async () => {
        return api.get('/tax-rules');
    },
    getById: async (id) => {
        return api.get(`/tax-rules/${id}`);
    },
    create: async (data) => {
        return api.post('/tax-rules', data);
    },
    update: async (id, data) => {
        return api.put(`/tax-rules/${id}`, data);
    },
    delete: async (id) => {
        return api.delete(`/tax-rules/${id}`);
    }
};

export default taxRuleService;
