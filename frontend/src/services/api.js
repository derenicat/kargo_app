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

// Kargo Paket İşlemleri
export const addCargo = (data) => api.post('/cargo', data);
export const getCargoByDate = (date) => api.get(`/cargo?date=${date}`);
export const loadScenarioTemplate = (date, scenarioId) => api.post('/cargo/load-template', { date, scenarioId });
export const seedRandomCargo = (date) => api.post('/cargo/seed-random', { date });

export const runOptimization = (data) => api.post('/optimize', data); // date ve optimizationMode alır

export default api;
