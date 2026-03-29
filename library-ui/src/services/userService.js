import { api } from './api';
import {
  getMockIssues,
  getMockPayments,
  getMockRecommendations,
  getMockProfile,
  getStoredMockProfile,
  shouldUseMockData,
  updateMockProfile,
} from '../mocks/mockApi';

export const userService = {
  getProfile: async () => {
    try {
      const response = await api.get('/me');
      return response?.user || response;
    } catch (error) {
      if (shouldUseMockData(error)) {
        return getMockProfile(getStoredSessionUser());
      }
      throw error;
    }
  },

  getMemberProfile: async () => {
    try {
      const response = await api.get('/me/member-profile');
      return response?.profile || response?.memberProfile || response;
    } catch (error) {
      if (shouldUseMockData(error)) {
        return getStoredMockProfile(getStoredSessionUser());
      }
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      return await api.put('/me/member-profile', data);
    } catch (error) {
      if (shouldUseMockData(error)) {
        return updateMockProfile(data);
      }
      throw error;
    }
  },

  getIssues: async () => {
    try {
      const response = await api.get('/me/issues');
      return extractCollection(response);
    } catch (error) {
      if (shouldUseMockData(error)) {
        return getMockIssues(getStoredSessionUser());
      }
      throw error;
    }
  },

  getPayments: async () => {
    try {
      const response = await api.get('/me/payments');
      return extractCollection(response);
    } catch (error) {
      if (shouldUseMockData(error)) {
        return getMockPayments(getStoredSessionUser());
      }
      throw error;
    }
  },

  getRecommendations: async () => {
    try {
      const response = await api.get('/me/recommendations', {
        params: { limit: 5 },
      });
      return extractCollection(response);
    } catch (error) {
      if (shouldUseMockData(error)) {
        return getMockRecommendations();
      }
      throw error;
    }
  },

  getReadingInsights: async () => {
    try {
      return await api.get('/me/reading-insights');
    } catch (error) {
      if (shouldUseMockData(error)) {
        return {
          readingPersona: 'Curious Starter',
          summary: 'Borrow a first title to help the assistant build a stronger reading profile.',
          focusAreas: ['New member activity'],
          nextAction: 'Try one book from the catalog to unlock richer suggestions.',
          attentionNote: 'No circulation blockers are currently active.',
          completedBooks: 0,
          activeLoans: 0,
          waitlistCount: 0,
        };
      }
      throw error;
    }
  },

  getReservations: async () => {
    try {
      const response = await api.get('/me/reservations');
      return extractCollection(response);
    } catch (error) {
      if (shouldUseMockData(error)) {
        return [];
      }
      throw error;
    }
  },

  createReservation: async (bookId) => {
    return api.post('/me/reservations', { bookId });
  },

  cancelReservation: async (reservationId) => {
    return api.delete(`/me/reservations/${reservationId}`);
  }
};

function extractCollection(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  return response.content || response.items || response.results || response.recommendations || response.issues || response.payments || response.reservations || [];
}

function getStoredSessionUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
