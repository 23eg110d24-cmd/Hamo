/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const profile = await api.get('/me');
          const resolvedUser = normalizeSessionUser(profile?.user || profile);
          localStorage.setItem('user', JSON.stringify(resolvedUser));
          setUser(resolvedUser);
        } catch (error) {
          console.error("Failed to restore session:", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for unauthorized events to trigger logout
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials) => {
    const data = await api.post('/auth/login', credentials);

    const session = persistAuthSession(data, credentials);
    if (!session) {
      throw new Error('Login failed');
    }

    setUser(session);
    return session;
  };

  const register = async (userData) => {
    const data = await api.post('/auth/register', userData);

    const session = persistAuthSession(data, userData);

    if (session) {
      setUser(session);
      return session;
    }

    return data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    try {
      if (localStorage.getItem('token')) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

function persistAuthSession(data, fallbackUser = {}) {
  const token = data?.token || data?.accessToken || data?.jwt;
  const refreshToken = data?.refreshToken || data?.refresh_token;
  const resolvedUser = data?.user || data?.profile || data?.account || {};

  if (!token) {
    return null;
  }

  localStorage.setItem('token', token);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }

  const sessionUser = normalizeSessionUser({
    ...resolvedUser,
    id: resolvedUser.id || fallbackUser.id,
    email: resolvedUser.email || fallbackUser.email,
    name: resolvedUser.name || fallbackUser.name,
    role: data?.role || resolvedUser.role || fallbackUser.role,
  });

  localStorage.setItem('user', JSON.stringify(sessionUser));
  return sessionUser;
}

function normalizeSessionUser(user = {}) {
  return {
    id: user.id || user.memberId || user.userId || 'unknown-user',
    email: user.email || '',
    name: user.name || user.fullName || 'User',
    role: user.role || 'MEMBER'
  };
}
