import api from './api';

const financeService = {
  getAll: async (page = 1, limit = 10, search = '', status = '', tanggal = '') => {
    const response = await api.get('/keuangan', {
      params: { page, limit, search, status, tanggal }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/keuangan/${id}`);
    return response.data;
  },

  getByPatient: async (pasienId) => {
    const response = await api.get(`/keuangan/pasien/${pasienId}`);
    return response.data;
  },

  getUnpaid: async () => {
    const response = await api.get('/keuangan/unpaid');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/keuangan/stats');
    return response.data;
  },

  getRevenue: async (startDate, endDate) => {
    const response = await api.get('/keuangan/revenue', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/keuangan', data);
    return response.data;
  },

  processPayment: async (id, data) => {
    const response = await api.put(`/keuangan/${id}/payment`, data);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/keuangan/${id}`);
    return response.data;
  }
};

export default financeService;
