import api from './api';

const laboratoryService = {
  getAll: async (page = 1, limit = 10, search = '', status = '', tanggal = '') => {
    const response = await api.get('/laboratorium', {
      params: { page, limit, search, status, tanggal }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/laboratorium/${id}`);
    return response.data;
  },

  getByPatient: async (pasienId) => {
    const response = await api.get(`/laboratorium/pasien/${pasienId}`);
    return response.data;
  },

  getPending: async () => {
    const response = await api.get('/laboratorium/pending');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/laboratorium/stats');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/laboratorium', data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/laboratorium/${id}/status`, {
      status_pemeriksaan: status
    });
    return response.data;
  },

  submitResult: async (id, data) => {
    const response = await api.put(`/laboratorium/${id}/result`, data);
    return response.data;
  },

  updateResult: async (id, data) => {
    const response = await api.patch(`/laboratorium/${id}/result`, data);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/laboratorium/${id}`);
    return response.data;
  }
};

export default laboratoryService;
