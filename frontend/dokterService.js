import api from './api';

const dokterService = {
  getAll: async (page = 1, limit = 10, search = '', spesialisasi = '') => {
    const response = await api.get('/dokter', {
      params: { page, limit, search, spesialisasi }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/dokter/${id}`);
    return response.data;
  },

  getSchedule: async (id) => {
    const response = await api.get(`/dokter/${id}/jadwal`);
    return response.data;
  },

  getBySpecialization: async (spesialisasi) => {
    const response = await api.get(`/dokter/spesialisasi/${spesialisasi}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/dokter/stats');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/dokter', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/dokter/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/dokter/${id}`);
    return response.data;
  }
};

export default dokterService;
