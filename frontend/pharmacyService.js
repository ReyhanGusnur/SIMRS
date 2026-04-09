import api from './api';

const pharmacyService = {
  getAll: async (page = 1, limit = 10, search = '', status = '', tanggal = '') => {
    const response = await api.get('/farmasi', {
      params: { page, limit, search, status, tanggal }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/farmasi/${id}`);
    return response.data;
  },

  getByPatient: async (pasienId) => {
    const response = await api.get(`/farmasi/pasien/${pasienId}`);
    return response.data;
  },

  getPending: async () => {
    const response = await api.get('/farmasi/pending');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/farmasi/stats');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/farmasi', data);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/farmasi/${id}/status`, {
      status_resep: status
    });
    return response.data;
  },

  dispense: async (id) => {
    const response = await api.put(`/farmasi/${id}/dispense`);
    return response.data;
  },

  updateMedication: async (id, detailId, data) => {
    const response = await api.patch(`/farmasi/${id}/medication/${detailId}`, data);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/farmasi/${id}`);
    return response.data;
  }
};

export default pharmacyService;
