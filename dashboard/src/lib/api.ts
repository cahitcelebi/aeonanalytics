import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to all requests
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

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Handle unauthorized errors (401)
    if (response && response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    // Handle forbidden errors (403)
    if (response && response.status === 403) {
      console.error('Permission denied');
    }
    
    // Handle server errors (500)
    if (response && response.status >= 500) {
      console.error('Server error:', response.data);
    }
    
    return Promise.reject(error);
  }
);

// Games API
export const gamesApi = {
  getAll: () => api.get('/games'),
  getById: (id: string) => api.get(`/games/${id}`),
  create: (data: any) => api.post('/games', data),
  update: (id: string, data: any) => api.put(`/games/${id}`, data),
  delete: (id: string) => api.delete(`/games/${id}`),
  refreshApiKey: (id: string) => api.post(`/games/${id}/refresh-api-key`),
  getMetrics: (id: string, params?: any) => api.get(`/games/${id}/metrics`, { params }),
};

// Events API
export const eventsApi = {
  getAll: (params?: any) => api.get('/api/events', { params }),
  getByGameId: (gameId: string, params?: any) => api.get(`/api/events/game/${gameId}`, { params }),
};

// Sessions API
export const sessionsApi = {
  getAll: (params?: any) => api.get('/api/sessions', { params }),
  getByGameId: (gameId: string, params?: any) => api.get(`/api/sessions/game/${gameId}`, { params }),
};

// Revenue API
export const revenueApi = {
  getAll: (params?: any) => api.get('/api/revenue', { params }),
  getByGameId: (gameId: string, params?: any) => api.get(`/api/revenue/game/${gameId}`, { params }),
};

// Monetization API
export const monetizationApi = {
  getAll: (params?: any) => api.get('/api/monetization', { params }),
  getByGameId: (gameId: string, params?: any) => api.get(`/api/monetization/game/${gameId}`, { params }),
};

// Progression API
export const progressionApi = {
  getAll: (params?: any) => api.get('/api/progression', { params }),
  getByGameId: (gameId: string, params?: any) => api.get(`/api/progression/game/${gameId}`, { params }),
};

export default api; 