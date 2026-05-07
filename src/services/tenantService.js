import api from './api';

const tenantService = {
  async getAll() {
    return await api.get('/tenants');
  },

  async getById(id) {
    return await api.get(`/tenants/${id}`);
  },

  async create(data) {
    return await api.post('/tenants', data);
  },

  async update(id, data) {
    return await api.put(`/tenants/${id}`, data);
  },

  async delete(id) {
    return await api.delete(`/tenants/${id}`);
  }
};

export default tenantService;
