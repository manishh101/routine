import axios from 'axios';

const API_URL = '/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds timeout
});

// Add a request interceptor to include the authorization token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Success: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.config?.url || 'unknown endpoint'}`, error);
    
    // Don't redirect on API errors for now - just log them
    // This prevents the site from disappearing due to automatic redirects
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - but not redirecting for public pages');
      // We'll handle auth properly later, for now just clear invalid tokens
      if (typeof window !== 'undefined') {
        const isOnPublicPage = ['/', '/dashboard', '/teachers', '/programs', '/subjects', '/classes', '/routine'].includes(window.location.pathname);
        if (!isOnPublicPage) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
    
    // Special handling for network errors to show more useful messages
    if (error.message === 'Network Error') {
      console.error('Network error - Backend server might be down');
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/users', userData),
  getProfile: () => api.get('/auth/me'),
};

// Teachers API
export const teachersAPI = {
  getTeachers: () => api.get('/teachers'),
  getTeacher: (id) => api.get(`/teachers/${id}`),
  createTeacher: (data) => api.post('/teachers', data),
  updateTeacher: (id, data) => api.put(`/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/teachers/${id}`),
};

// Programs API
export const programsAPI = {
  getPrograms: () => api.get('/programs'),
  getProgram: (id) => api.get(`/programs/${id}`),
  createProgram: (data) => api.post('/programs', data),
  updateProgram: (id, data) => api.put(`/programs/${id}`, data),
  deleteProgram: (id) => api.delete(`/programs/${id}`),
};

// Subjects API
export const subjectsAPI = {
  getSubjects: () => api.get('/subjects'),
  getSubject: (id) => api.get(`/subjects/${id}`),
  getSubjectsByProgram: (programId) => api.get(`/subjects/program/${programId}`),
  getSubjectsBySemester: (semester) => api.get(`/subjects/semester/${semester}`),
  createSubject: (data) => api.post('/subjects', data),
  updateSubject: (id, data) => api.put(`/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
};

// Classes API
export const classesAPI = {
  getClasses: () => api.get('/classes'),
  getClass: (id) => api.get(`/classes/${id}`),
  getClassesByTeacher: (teacherId) => api.get(`/classes/teacher/${teacherId}`),
  getClassesByProgramAndSemester: (programId, semester) => 
    api.get(`/classes/program/${programId}/semester/${semester}`),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/classes/${id}`),
};

export default api;
