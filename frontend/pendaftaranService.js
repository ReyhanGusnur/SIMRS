import api from './api';

const pendaftaranService = {
  getAll: async (page = 1, limit = 10, search = '', status = '', tanggal = '') => {
    const response = await api.get('/pendaftaran', {
      params: { page, limit, search, status, tanggal }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/pendaftaran/${id}`);
    return response.data;
  },

  getQueue: async (poliId = '') => {
    const endpoint = poliId ? `/pendaftaran/queue/${poliId}` : '/pendaftaran/queue';
    const response = await api.get(endpoint);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/pendaftaran/stats');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/pendaftaran', data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/pendaftaran/${id}/status`, {
      status_pendaftaran: status
    });
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/pendaftaran/${id}`);
    return response.data;
  }
};

export default pendaftaranService;
