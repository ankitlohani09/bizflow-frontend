import api from './api';

const taxRuleService = {
    getAll: async () => {
        const response = await api.get('/tax-rules');
        return response.data.data;
    },
    getById: async (id) => {
        const response = await api.get(`/tax-rules/${id}`);
        return response.data.data;
    },
    create: async (data) => {
        const response = await api.post('/tax-rules', data);
        return response.data.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/tax-rules/${id}`, data);
        return response.data.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/tax-rules/${id}`);
        return response.data.data;
    }
};

export default taxRuleService;
