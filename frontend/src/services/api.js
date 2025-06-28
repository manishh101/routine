import axios from 'axios';

const API_URL = '/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout (increased from 10s)
});

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

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
    console.log(`API Success: ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`API Error: ${error.config?.url || 'unknown endpoint'}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle authentication errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip token refresh for login endpoint
      if (originalRequest.url === '/auth/login') {
        return Promise.reject(error);
      }
      
      // Check if we're on an auth page to prevent redirect loops
      if (typeof window !== 'undefined') {
        const authRelatedPages = ['/admin/login', '/login', '/register'];
        const isOnAuthPage = authRelatedPages.some(path => 
          window.location.pathname.includes(path)
        );
        
        if (isOnAuthPage) {
          return Promise.reject(error);
        }
      }
      
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      console.warn('401 Unauthorized detected - clearing auth and redirecting to login');
      originalRequest._retry = true;
      isRefreshing = true;

      // Since we don't have refresh token functionality, just clear auth and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Process queued requests with error
      processQueue(error, null);
      isRefreshing = false;
      
      // Redirect to login
      if (typeof window !== 'undefined') {
        // Use the correct admin login path
        window.location.href = '/admin/login';
      }
      
      return Promise.reject(error);
    }
    
    // Special handling for network errors
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
  refreshToken: () => api.post('/auth/refresh-token'),
  logout: () => {
    // Clear tokens on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    return api.post('/auth/logout');
  }
};

// Teachers API
export const teachersAPI = {
  getAllTeachers: () => {
    console.log('Fetching all teachers - Starting request');
    const startTime = performance.now();
    return api.get('/teachers')
      .then(response => {
        const endTime = performance.now();
        console.log(`Successfully fetched teachers in ${endTime - startTime}ms`, response);
        return response;
      })
      .catch(error => {
        const endTime = performance.now();
        console.error(`Error fetching teachers after ${endTime - startTime}ms:`, {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          timeout: error.code === 'ECONNABORTED',
          stack: error.stack
        });
        throw error;
      });
  },
  
  getTeachers: () => {
    console.log('Fetching all teachers - Starting request');
    const startTime = performance.now();
    return api.get('/teachers')
      .then(response => {
        const endTime = performance.now();
        console.log(`Successfully fetched teachers in ${endTime - startTime}ms`, response);
        return response;
      })
      .catch(error => {
        const endTime = performance.now();
        console.error(`Error fetching teachers after ${endTime - startTime}ms:`, {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          timeout: error.code === 'ECONNABORTED',
          stack: error.stack
        });
        throw error;
      });
  },
  
  getTeacher: (id) => {
    console.log(`Fetching teacher with ID: ${id}`);
    return api.get(`/teachers/${id}`)
      .catch(error => {
        console.error(`Error fetching teacher ${id}:`, error);
        throw error;
      });
  },
  
  getTeacherSchedule: (id) => {
    console.log(`Fetching schedule for teacher with ID: ${id}`);
    return api.get(`/teachers/${id}/schedule`)
      .then(response => {
        console.log(`Successfully fetched schedule for teacher ${id}`);
        
        // Advanced logging to help diagnose issues
        if (response.data) {
          console.log('Teacher schedule response structure:', {
            hasSuccessProperty: 'success' in response.data,
            hasDataProperty: 'data' in response.data,
            dataType: typeof response.data.data,
            topLevelKeys: Object.keys(response.data)
          });
          
          // Check nested routine location
          if (response.data.data?.routine) {
            const routine = response.data.data.routine;
            console.log('Found routine in response.data.data', {
              dayCount: Object.keys(routine).length,
              firstDay: Object.keys(routine)[0],
              hasClasses: !!Object.values(routine)[0]
            });
          } else if (response.data.routine) {
            const routine = response.data.routine;
            console.log('Found routine directly in response.data', {
              dayCount: Object.keys(routine).length,
              firstDay: Object.keys(routine)[0],
              hasClasses: !!Object.values(routine)[0]
            });
          } else {
            console.warn('Could not find routine object in response');
          }
        }
        
        return response.data;
      })
      .catch(error => {
        console.error(`Error fetching schedule for teacher ${id}:`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          error: error.response?.data
        });
        throw error;
      });
  },
  
  exportTeacherSchedule: (id) => {
    console.log(`Exporting schedule for teacher with ID: ${id}`);
    return api.get(`/teachers/${id}/schedule/excel`, {
      responseType: 'blob'
    })
    .then(response => {
      console.log(`Successfully exported schedule for teacher ${id}`);
      return response; // For blob responses, return the full response
    })
    .catch(error => {
      console.error(`Error exporting schedule for teacher ${id}:`, error);
      throw error;
    });
  },
  
  exportTeacherScheduleToExcel: (id) => {
    console.log(`Exporting schedule for teacher with ID: ${id}`);
    return api.get(`/teachers/${id}/schedule/excel`, {
      responseType: 'blob'
    }).catch(error => {
      console.error(`Error exporting schedule for teacher ${id}:`, error);
      throw error;
    });
  }
};

// Programs API
export const programsAPI = {
  getPrograms: () => api.get('/programs')
};

// Program Semesters API
export const programSemestersAPI = {
  getCurriculum: (programCode) => api.get(`/program-semesters/${programCode}`)
};

// Routines API
export const routinesAPI = {
  getRoutine: (programCode, semester, section) => 
    api.get(`/routines/${programCode}/${semester}/${section}`),
  
  exportRoutineToExcel: (programCode, semester, section) =>
    api.get(`/routines/${programCode}/${semester}/${section}/export`, {
      responseType: 'blob'
    }),
    
  importRoutineFromExcel: (programCode, semester, section, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('programCode', programCode);
    formData.append('semester', semester);
    formData.append('section', section);
    
    return api.post(`/routines/${programCode}/${semester}/${section}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
    
  assignClass: (programCode, semester, section, classData) =>
    api.post(
      `/routines/${programCode}/${semester}/${section}/assign`, 
      classData
    ),
    
  clearClass: (programCode, semester, section, classData) =>
    api.delete(
      `/routines/${programCode}/${semester}/${section}/clear`, 
      { data: classData }
    ),
  
  // For assigning a class that spans multiple periods
  assignClassSpanned: (data) =>
    api.post(`/routines/assign-class-spanned`, data),
    
  // Check teacher availability
  checkTeacherAvailability: (teacherId, dayIndex, slotIndex) =>
    api.get(`/routines/teachers/${teacherId}/availability?dayIndex=${dayIndex}&slotIndex=${slotIndex}`),
    
  // Check room availability
  checkRoomAvailability: (roomId, dayIndex, slotIndex) =>
    api.get(`/routines/rooms/${roomId}/availability?dayIndex=${dayIndex}&slotIndex=${slotIndex}`),
    
  // Get available subjects for a program-semester
  getAvailableSubjects: (programCode, semester) =>
    api.get(`/routines/${programCode}/${semester}/subjects`)
};

// Subjects API
export const subjectsAPI = {
  getSubjects: () => api.get('/subjects'),
  getSubjectsByProgramAndSemester: (programCode, semester) => {
    const url = `/routines/${programCode}/${semester}/subjects`;
    console.log('Making subjects API call to:', url);
    return api.get(url);
  }
};

// Rooms API
export const roomsAPI = {
  getRooms: () => api.get('/rooms')
};

// TimeSlots API
export const timeSlotsAPI = {
  getTimeSlots: () => api.get('/timeslots')
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData)
};

export default api;