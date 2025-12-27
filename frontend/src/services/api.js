import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const getStations = () => api.get('/stations');
export const createStation = (data) => api.post('/stations', data);
export const deleteStation = (id) => api.delete(`/stations/${id}`);

export const getScenarios = () => api.get('/scenarios');
export const getScenarioById = (id) => api.get(`/scenarios/${id}`);
export const createScenario = (data) => api.post('/scenarios', data);
export const runOptimization = (scenarioId) => api.post('/optimize', { scenarioId });

export default api;
