import axios from 'axios';
import { AuthResponse, NotificationPreferences, Subscription, SubscriptionInput, User } from '../types';

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // In production, use relative path
  : 'http://localhost:5000/api'; // In development, use local server

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export const subscriptionService = {
  getAll: () => api.get('/subscriptions'),
  getRenewals: () => api.get('/subscriptions/renewals'),
  getStats: () => api.get('/subscriptions/stats'),
  updateAutoRenewal: (id: string, autoRenew: boolean) => 
    api.patch(`/subscriptions/${id}/auto-renewal`, { autoRenew }),
  getById: (id: string) => api.get(`/subscriptions/${id}`),
  create: (data: SubscriptionInput) => 
      api.post<Subscription>('/subscriptions', data)
        .catch(error => {
          console.error('Subscription creation error:', error.response?.data);
        throw error;
      }),
  update: (id: string, data: { name?: string; price?: number; duration?: number }) => api.put(`/subscriptions/${id}`, data),
  delete: (id: string) => api.delete(`/subscriptions/${id}`),
};

export const authService = {
  signIn: (credentials: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', credentials),
    
  signUp: async (userData: { name: string; email: string; password: string }) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', userData);
      return response;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const errorData = error.response.data;
        throw new Error(
          errorData.message || 
          errorData.errors?.[0]?.msg || 
          'Invalid registration data'
        );
      }
      throw error;
    }
  },
    
  verifyEmail: (token: string) => 
    api.get(`/auth/verify-email/${token}`),
    
  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) =>
    api.post(`/auth/reset-password/${token}`, { password }),
  googleAuth: (credential: string) =>
    api.post<AuthResponse>('/auth/google', { credential }),
  googleSignIn: (credential: string) =>
    api.post<AuthResponse>('/auth/google', { credential }),
};

export const reminderService = {
  getAll: () => api.get('/reminders'),
  create: (data: { title: string; description: string; date: string }) => api.post('/reminders', data),
  update: (id: string, data: { title?: string; description?: string; date?: string }) => api.put(`/reminders/${id}`, data),
  delete: (id: string) => api.delete(`/reminders/${id}`),
  getUpcoming: () => api.get('/reminders/upcoming'),
  snooze: (id: string, duration: number) => api.post(`/reminders/${id}/snooze`, { duration })
};

export const userService = {
  updateProfile: (data: Partial<User>) => api.put('/users/profile', data),
  updateSettings: (settings: Record<string, unknown>) => api.put('/users/settings', settings),
  updateNotifications: (preferences: NotificationPreferences) => 
    api.put('/users/notifications', preferences),
  updateNotificationPreferences: (preferences: NotificationPreferences) => 
    api.put('/reminders/preferences', preferences),
  getNotificationPreferences: () => api.get('/users/notifications'),
};

export const gmailAuthService = {
  authorize: () => api.get('/auth/gmail/url'),
  handleCallback: (code: string) => 
    api.post('/auth/gmail/callback', { code }),
  getSubscriptions: () => 
    api.get('/gmail/subscriptions'),
};

export default api;