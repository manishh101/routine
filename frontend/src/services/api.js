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
    
    // Don't redirect on API errors for public pages
    // This prevents the site from disappearing due to automatic redirects
    if (error.response?.status === 401) {
      console.warn('401 Unauthorized - but not redirecting for public pages');
      // We'll handle auth properly later, for now just clear invalid tokens
      if (typeof window !== 'undefined') {
        const isOnPublicPage = ['/', '/dashboard', '/teachers', '/programs', '/subjects', '/classes', '/routine'].includes(window.location.pathname);
        // Never remove tokens on public pages to prevent redirects
        if (!isOnPublicPage) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
    
    // Always return a Promise.reject to prevent page disappearing on API errors
    return Promise.reject(error);
    
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

// Program Semesters API (New Curriculum Management)
export const programSemestersAPI = {
  getCurriculum: (programCode) => api.get(`/program-semesters/${programCode}`),
  getSubjectsForSemester: (programCode, semester) => 
    api.get(`/program-semesters/${programCode}/${semester}/subjects`),
  createCurriculum: (data) => api.post('/program-semesters', data),
  updateCurriculum: (programCode, semester, data) => 
    api.put(`/program-semesters/${programCode}/${semester}`, data),
  addSubjectToSemester: (programCode, semester, subjectData) => 
    api.post(`/program-semesters/${programCode}/${semester}/subjects`, subjectData),
  removeSubjectFromSemester: (programCode, semester, subjectId) => 
    api.delete(`/program-semesters/${programCode}/${semester}/subjects/${subjectId}`),
};

// Classes API
export const classesAPI = {
  getClasses: () => api.get('/classes'),
  getClass: (id) => api.get(`/classes/${id}`),
  getClassesByTeacher: (teacherId) => api.get(`/classes/teacher/${teacherId}`),
  getClassesByProgramAndSemester: (programId, semester) => 
    api.get(`/classes/program/${programId}/semester/${semester}`),
  getClassesByProgramSemesterAndSection: (programId, semester, section) => 
    api.get(`/classes/program/${programId}/semester/${semester}/section/${section}`),
  createClass: (data) => api.post('/classes', data),
  updateClass: (id, data) => api.put(`/classes/${id}`, data),
  deleteClass: (id) => api.delete(`/classes/${id}`),
};

// Routines API (Updated for new backend)
export const routinesAPI = {
  getRoutine: (programCode, semester, section) => 
    api.get(`/routines/${programCode}/${semester}/${section}`),
  getProgramRoutines: (programCode) => api.get(`/routines/${programCode}`),
  assignClass: (programCode, semester, section, classData) => 
    api.post(`/routines/${programCode}/${semester}/${section}/assign`, classData),
  clearClass: (programCode, semester, section, slotData) => 
    api.delete(`/routines/${programCode}/${semester}/${section}/clear`, { data: slotData }),
  checkTeacherAvailability: (teacherId, dayIndex, slotIndex) => 
    api.get(`/schedules/teacher/${teacherId}/availability?dayIndex=${dayIndex}&slotIndex=${slotIndex}`),
  checkRoomAvailability: (roomId, dayIndex, slotIndex) => 
    api.get(`/routines/rooms/${roomId}/availability?dayIndex=${dayIndex}&slotIndex=${slotIndex}`),
  checkConflicts: (conflictData) => api.post('/routines/check-conflicts', conflictData),
};

// Rooms API
export const roomsAPI = {
  getRooms: () => api.get('/rooms'),
  getRoom: (id) => api.get(`/rooms/${id}`),
  createRoom: (data) => api.post('/rooms', data),
  updateRoom: (id, data) => api.put(`/rooms/${id}`, data),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
};

// Time Slots API
export const timeslotsAPI = {
  getTimeSlots: () => api.get('/timeslots'),
  getTimeSlot: (id) => api.get(`/timeslots/${id}`),
  createTimeSlot: (data) => api.post('/timeslots', data),
  updateTimeSlot: (id, data) => api.put(`/timeslots/${id}`, data),
  deleteTimeSlot: (id) => api.delete(`/timeslots/${id}`),
  initializeTimeSlots: () => api.post('/timeslots/init'),
};

// Schedules API
export const schedulesAPI = {
  getTeacherSchedule: (teacherId) => api.get(`/schedules/teacher/${teacherId}`),
  regenerateTeacherSchedule: (teacherId) => api.post(`/schedules/teacher/${teacherId}/regenerate`),
  getAllTeacherSchedules: () => api.get('/schedules/teachers'),
  regenerateAllTeacherSchedules: () => api.post('/schedules/regenerate-all'),
  checkTeacherAvailability: (teacherId, dayIndex, slotIndex) => 
    api.get(`/schedules/teacher/${teacherId}/availability?dayIndex=${dayIndex}&slotIndex=${slotIndex}`),
};

export default api;
