import api from './api';

const rekamMedisService = {
  getAll: async (page = 1, limit = 10, search = '', pasienId = '') => {
    const response = await api.get('/rekam-medis', {
      params: { page, limit, search, pasien_id: pasienId }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/rekam-medis/${id}`);
    return response.data;
  },

  getByPatient: async (pasienId) => {
    const response = await api.get(`/rekam-medis/pasien/${pasienId}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/rekam-medis/stats');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/rekam-medis', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/rekam-medis/${id}`, data);
    return response.data;
  }
};

export default rekamMedisService;
