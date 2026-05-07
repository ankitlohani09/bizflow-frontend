import api from './api';

/**
 * logService – handles system activity and AI logs
 */
const logService = {
  /**
   * Fetch all system activity logs
   */
  getActivityLogs: async () => {
    return api.get('/activity-logs');
  },

  /**
   * Fetch activity logs for a specific user
   */
  getLogsByUser: async (userId) => {
    return api.get(`/activity-logs/user/${userId}`);
  },

  /**
   * Fetch activity logs for a specific entity (e.g. INVOICE, 101)
   */
  getLogsByEntity: async (entityType, entityId) => {
    return api.get(`/activity-logs/entity/${entityType}/${entityId}`);
  },

  /**
   * Fetch all AI interaction logs
   */
  getAiLogs: async () => {
    return api.get('/ai-logs');
  },

  /**
   * Fetch AI logs for a specific user
   */
  getAiLogsByUser: async (userId) => {
    return api.get(`/ai-logs/user/${userId}`);
  }
};

export default logService;
