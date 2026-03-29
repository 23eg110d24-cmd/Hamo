import { api } from './api';
import { shouldUseMockData } from '../mocks/mockApi';

const EMPTY_DASHBOARD = {
  totalBooks: 0,
  totalMembers: 0,
  totalUsers: 0,
  activeIssues: 0,
  overdueIssues: 0,
  outstandingFines: 0,
  finesCollected: 0,
};

export const dashboardService = {
  getOverview: async () => {
    try {
      const response = await api.get('/dashboard');
      return { ...EMPTY_DASHBOARD, ...(response || {}) };
    } catch (error) {
      if (shouldUseMockData(error)) {
        return EMPTY_DASHBOARD;
      }
      throw error;
    }
  },
};
