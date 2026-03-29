import {
  getMockMemberProfile,
  getMockUserByCredentials,
  mockBooks,
  mockIssues,
  mockRecommendations,
  mockUsersByEmail,
} from './libraryData';

const MOCK_PROFILE_KEY = 'mock-profile';

export function shouldUseMockData(error) {
  const message = String(error?.message || '');
  return message.includes('Failed to fetch') || message.includes('NetworkError');
}

export function mockLogin(credentials) {
  const user = getMockUserByCredentials(credentials.email, credentials.password);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  return {
    token: `mock-token-${user.role.toLowerCase()}`,
    refreshToken: `mock-refresh-${user.role.toLowerCase()}`,
    user,
  };
}

export function mockRegister(userData) {
  const normalizedEmail = userData.email?.toLowerCase?.() || userData.email;
  const existing = normalizedEmail ? mockUsersByEmail[normalizedEmail] : null;

  return {
    token: `mock-token-${Date.now()}`,
    refreshToken: `mock-refresh-${Date.now()}`,
    user: existing || {
      id: `member-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'MEMBER',
      phone: userData.phone || '',
      department: userData.department || '',
    },
  };
}

export function getMockBooks(params = {}) {
  const keyword = String(params.keyword || '').toLowerCase().trim();
  const category = String(params.category || '').trim();

  return mockBooks.filter((book) => {
    const matchesKeyword =
      !keyword ||
      book.title.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword) ||
      book.isbn.toLowerCase().includes(keyword);
    const matchesCategory = !category || book.category === category;
    return matchesKeyword && matchesCategory;
  });
}

export function getMockBookById(id) {
  return mockBooks.find((book) => String(book.id) === String(id) || String(book.isbn) === String(id)) || null;
}

export function getMockProfile(user) {
  return getMockMemberProfile(user) || {
    id: user?.id || 'mock-user',
    name: user?.name || 'Library User',
    email: user?.email || 'member@library.com',
    role: user?.role || 'MEMBER',
    phone: '',
    department: '',
  };
}

export function updateMockProfile(data) {
  const current = readStoredMockProfile();
  const nextProfile = {
    ...current,
    ...data,
  };
  localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(nextProfile));
  return nextProfile;
}

export function getStoredMockProfile(user) {
  const stored = readStoredMockProfile();
  if (stored) {
    return stored;
  }

  const profile = getMockProfile(user);
  localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function getMockIssues(user) {
  const memberProfile = getMockMemberProfile(user);
  const memberId = memberProfile?.id || 'C101';
  return mockIssues.filter((issue) => issue.memberId === memberId);
}

export function getMockRecommendations() {
  return mockRecommendations;
}

export function getMockPayments(user) {
  return getMockIssues(user)
    .filter((issue) => issue.fineAmount > 0)
    .map((issue) => ({
      id: `payment-${issue.id}`,
      issueId: issue.id,
      amount: issue.fineAmount,
      status: issue.finePaid ? 'PAID' : 'PENDING',
      createdAt: issue.issueDate,
    }));
}

export function mockCreatePaymentOrder(issue) {
  return {
    id: `mock-order-${issue.id}`,
    orderId: `mock-order-${issue.id}`,
    gatewayOrderId: `mock-gateway-order-${issue.id}`,
    paymentRecordId: `mock-payment-record-${issue.id}`,
    amount: Number(issue.fineAmount || issue.amount || 0),
    currency: 'INR',
    status: 'CREATED',
  };
}

export function mockConfirmPayment(paymentDetails) {
  return {
    success: true,
    referenceId: paymentDetails.gatewayPaymentId || `mock-payment-${Date.now()}`,
    gatewayPaymentId: paymentDetails.gatewayPaymentId || `mock-payment-${Date.now()}`,
    paymentId: paymentDetails.paymentRecordId,
    message: 'Mock payment confirmed from dataset-backed simulation.',
  };
}

function readStoredMockProfile() {
  try {
    const raw = localStorage.getItem(MOCK_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
