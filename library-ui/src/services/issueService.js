import { api } from './api';
import { shouldUseMockData } from '../mocks/mockApi';

export const issueService = {
  getAll: async () => getIssueCollection('/issues'),
  getActive: async () => getIssueCollection('/issues/active'),
  getOverdue: async () => getIssueCollection('/issues/overdue'),
  create: async (data) => api.post('/issues', data),
  returnBook: async (issueId) => api.put(`/issues/${issueId}/return`),
};

async function getIssueCollection(endpoint) {
  try {
    const response = await api.get(endpoint);
    return extractCollection(response);
  } catch (error) {
    if (shouldUseMockData(error)) {
      return [];
    }
    throw error;
  }
}

function extractCollection(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== 'object') {
    return [];
  }

  return response.content || response.items || response.issues || response.results || [];
}
