import api from './api';

const radiologyService = {
  getAll: async (page = 1, limit = 10, search = '', status = '', tanggal = '') => {
    const response = await api.get('/radiologi', {
      params: { page, limit, search, status, tanggal }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/radiologi/${id}`);
    return response.data;
  },

  getByPatient: async (pasienId) => {
    const response = await api.get(`/radiologi/pasien/${pasienId}`);
    return response.data;
  },

  getPending: async () => {
    const response = await api.get('/radiologi/pending');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/radiologi/stats');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/radiologi', data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/radiologi/${id}/status`, {
      status_pemeriksaan: status
    });
    return response.data;
  },

  submitResult: async (id, data) => {
    const response = await api.put(`/radiologi/${id}/result`, data);
    return response.data;
  },

  updateResult: async (id, data) => {
    const response = await api.patch(`/radiologi/${id}/result`, data);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/radiologi/${id}`);
    return response.data;
  }
};

export default radiologyService;
