import { api } from './api';
import { getMockBookById, getMockBooks, shouldUseMockData } from '../mocks/mockApi';

export const bookService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/books', { params });
      return extractCollection(response);
    } catch (error) {
      if (shouldUseMockData(error)) {
        return getMockBooks(params);
      }
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/books/${id}`);
      return response?.book || response;
    } catch (error) {
      if (shouldUseMockData(error)) {
        return getMockBookById(id);
      }
      throw error;
    }
  },

  create: async (data) => {
    return api.post('/books', data);
  },

  update: async (id, data) => {
    return api.put(`/books/${id}`, data);
  },

  delete: async (id) => {
    return api.delete(`/books/${id}`);
  }
};

function extractCollection(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  return response.content || response.items || response.books || response.results || [];
}
