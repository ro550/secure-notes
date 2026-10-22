
import axios from 'axios';

export const TOKEN_KEY = 'token';

// Centralize API configuration so the base URL can change through environment variables.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the stored JWT to outgoing requests to authenticate protected API endpoints.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_ATTEMPT_PATHS = ['/auth/login', '/auth/register'];

// Handle expired sessions centrally while preserving login and registration errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthAttempt = AUTH_ATTEMPT_PATHS.includes(error.config?.url);

    if (error.response?.status === 401 && !isAuthAttempt) {
      // Clear the invalid token and notify the application to end the user's session.
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Extract a readable error message from the API response or use the fallback message.
export function getErrorMessage(err, fallback) {
  const data = err.response?.data;
  if (data?.details?.length) return data.details.map((d) => d.message).join('. ');
  return data?.error || fallback;
}

// Authentication-related API requests.
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Note CRUD operations and the pin-status toggle.
export const notesAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getOne: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  togglePin: (id) => api.patch(`/notes/${id}/pin`),
};

export default api;
