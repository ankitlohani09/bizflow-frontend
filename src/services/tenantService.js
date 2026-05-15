import api from './api';

const cache = {};

const tenantService = {
  async getAll() {
    return await api.get('/tenants');
  },

  async getById(id) {
    if (cache[id]) {
      return cache[id];
    }
    const promise = api.get(`/tenants/${id}`);
    cache[id] = promise;
    
    // Remove from cache on error so it can be retried
    promise.catch(() => {
      delete cache[id];
    });
    
    return promise;
  },

  async create(data) {
    return await api.post('/tenants', data);
  },

  async update(id, data) {
    return await api.put(`/tenants/${id}`, data);
  },

  async delete(id) {
    return await api.delete(`/tenants/${id}`);
  },

  async getStats(id) {
    return await api.get(`/tenants/${id}/stats`);
  },

  async getGlobalStats() {
    return await api.get('/tenants/global-stats');
  },

  async regenerateLink(id) {
    return await api.post(`/tenants/${id}/regenerate-link`);
  }
};

export default tenantService;
