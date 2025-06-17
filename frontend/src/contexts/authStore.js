import { create } from 'zustand';
import axios from 'axios';

// API base URL
const API_URL = '/api';

const useAuthStore = create((set, get) => {
  // Safe localStorage access
  const getFromLocalStorage = (key) => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  };

  const setToLocalStorage = (key, value) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  };

  const removeFromLocalStorage = (key) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };

  return {
  token: getFromLocalStorage('token'),
  user: (() => {
    const userStr = getFromLocalStorage('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  })(),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToLocalStorage('token', res.data.token);
      
      // Get user details
      const config = {
        headers: {
          Authorization: `Bearer ${res.data.token}`,
        },
      };
      const userRes = await axios.get(`${API_URL}/auth/me`, config);
      setToLocalStorage('user', JSON.stringify(userRes.data));
      
      set({ token: res.data.token, user: userRes.data, isLoading: false });
      return true;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      set({ 
        isLoading: false, 
        error: error.response?.data?.msg || error.response?.data?.errors?.[0]?.msg || 'Failed to login' 
      });
      return false;
    }
  },

  // Admin-only function to register new users
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const token = getFromLocalStorage('token');
      if (!token) {
        throw new Error('Admin authentication required');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      
      const res = await axios.post(`${API_URL}/users`, userData, config);
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error('Register error:', error.response?.data || error.message);
      set({ 
        isLoading: false, 
        error: error.response?.data?.msg || error.response?.data?.errors?.[0]?.msg || 'Failed to register user' 
      });
      return false;
    }
  },

  logout: () => {
    removeFromLocalStorage('token');
    removeFromLocalStorage('user');
    set({ token: null, user: null });
  },

  clearError: () => set({ error: null }),
}});

export default useAuthStore;
