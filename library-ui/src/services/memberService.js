import { api } from './api';
import { shouldUseMockData } from '../mocks/mockApi';

export const memberService = {
  getAll: async () => {
    try {
      const response = await api.get('/members');
      return extractCollection(response);
    } catch (error) {
      if (shouldUseMockData(error)) {
        return [];
      }
      throw error;
    }
  },

  create: async (data) => api.post('/members', data),

  update: async (id, data) => api.put(`/members/${id}`, data),

  remove: async (id) => api.delete(`/members/${id}`),
};

function extractCollection(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  return response.content || response.items || response.members || response.results || [];
}
