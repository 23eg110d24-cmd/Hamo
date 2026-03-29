import { api } from './api';
import { shouldUseMockData } from '../mocks/mockApi';

const DEFAULT_SETTINGS = {
  borrowPeriodDays: 7,
  fineAmountPerWeek: 30,
  paymentMode: 'SIMULATED',
  databaseMode: 'FILE_BASED_H2',
  reservationsEnabled: true,
  aiRecommendationsEnabled: true,
};

export const settingsService = {
  getSettings: async () => {
    try {
      const response = await api.get('/settings');
      return { ...DEFAULT_SETTINGS, ...(response || {}) };
    } catch (error) {
      if (shouldUseMockData(error)) {
        return DEFAULT_SETTINGS;
      }
      throw error;
    }
  },
};
