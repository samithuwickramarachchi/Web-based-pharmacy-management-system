import api from './api';

const promotionService = {
  getAll: async (page = 0, size = 15) => {
    const response = await api.get('/promotions', {
      params: { page, size, sort: 'id,desc' }
    });
    return response.data;
  },

  getActive: async () => {
    const response = await api.get('/promotions/active');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/promotions/${id}`);
    return response.data;
  },

  getByCode: async (code) => {
    const response = await api.get(`/promotions/code/${code}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/promotions', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/promotions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/promotions/${id}`);
    return response.data;
  },

  validateCoupon: async (data) => {
    const response = await api.post('/promotions/validate-coupon', data);
    return response.data;
  }
};

export default promotionService;
