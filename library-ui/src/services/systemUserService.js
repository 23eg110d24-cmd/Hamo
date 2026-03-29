import { api } from './api';
import { shouldUseMockData } from '../mocks/mockApi';

export const systemUserService = {
  getAll: async () => {
    try {
      const response = await api.get('/users');
      return extractCollection(response);
    } catch (error) {
      if (shouldUseMockData(error)) {
        return [];
      }
      throw error;
    }
  },

  updateStatus: async (id, active) => api.put(`/users/${id}/status`, { active }),
};

function extractCollection(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  return response.content || response.items || response.users || response.results || [];
}
