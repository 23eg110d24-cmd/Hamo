import { api } from './api';
import { mockConfirmPayment, mockCreatePaymentOrder, shouldUseMockData } from '../mocks/mockApi';

export const paymentService = {
  createOrder: async (issue) => {
    const amount = Number(issue.fineAmount || issue.amount || 0);
    try {
      const response = await api.post('/payments/orders', {
        issueId: issue.id,
        amount,
        gateway: 'SIMULATED_RAZORPAY',
        callbackUrl: `${window.location.origin}/payments/result`
      });
      return response?.order || response;
    } catch (error) {
      if (shouldUseMockData(error)) {
        return mockCreatePaymentOrder(issue);
      }
      throw error;
    }
  },

  confirmPayment: async (paymentDetails) => {
    try {
      const response = await api.post('/payments/confirm', paymentDetails);
      return response?.payment || response;
    } catch (error) {
      if (shouldUseMockData(error)) {
        return mockConfirmPayment(paymentDetails);
      }
      throw error;
    }
  }
};
