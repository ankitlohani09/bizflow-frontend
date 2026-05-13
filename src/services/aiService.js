import api from './api';

/**
 * aiService – handles AI-powered business queries and predictions
 */
const aiService = {
  /**
   * Submit a text query to the AI engine
   * @param {string} queryText 
   */
  query: async (queryText) => {
    return api.post('/ai/query', { query: queryText }, { timeout: 120000 });
  },

  /**
   * Get predictive reorder suggestions for inventory
   */
  getReorderSuggestions: async (fromDate, toDate) => {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return api.get('/ai/reorder-suggestions', { params });
  },

  /**
   * Get seasonal sales trend detection
   */
  getSeasonalTrends: async (fromDate, toDate) => {
    const params = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return api.get('/ai/seasonal-trends', { params });
  }
};

export default aiService;
