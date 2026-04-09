import api from './api';

const pasienService = {
  getAll: async (page = 1, limit = 10, search = '') => {
    const response = await api.get('/pasien', {
      params: { page, limit, search }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/pasien/${id}`);
    return response.data;
  },

  getByNoRM: async (noRM) => {
    const response = await api.get(`/pasien/no-rm/${noRM}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/pasien/stats');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/pasien', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/pasien/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/pasien/${id}`);
    return response.data;
  }
};

export default pasienService;
