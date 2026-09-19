import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to inject JWT auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('traffic_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Traffic and Execution API endpoints
export const trafficApi = {
  getNetworkState: () => api.get('/traffic/network-state'),
  getIncidents: () => api.get('/traffic/incidents'),
  getForecasts: (edgeId) => api.get(`/traffic/forecasts${edgeId ? `?edgeId=${edgeId}` : ''}`),
  getRoadNetwork: () => api.get('/traffic/road-network')
};

export const executionApi = {
  trigger: (payload) => api.post('/executions/trigger', payload),
  list: () => api.get('/executions'),
  getById: (id) => api.get(`/executions/${id}`),
  getLogs: (id) => api.get(`/executions/${id}/logs`)
};

export const simulationApi = {
  runDiversion: (payload) => api.post('/simulations/diversion', payload),
  runModification: (payload) => api.post('/simulations/modification', payload),
  list: () => api.get('/simulations'),
  getTemplates: () => api.get('/simulations/templates')
};

export const advisoryApi = {
  list: () => api.get('/advisories'),
  updateStatus: (id, status) => api.put(`/advisories/${id}/status`, { status }),
  getAuditReport: () => api.get('/advisories/audit-report')
};

export const datasetApi = {
  list: () => api.get('/datasets'),
  getSamples: () => api.get('/datasets/samples'),
  upload: (formData) => api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  quickSwitch: (role) => api.get(`/auth/quick-switch/${role}`)
};

export default api;
