import api from './api';

const deliveryService = {
  getAll: async (page = 0, size = 15) => {
    const response = await api.get('/deliveries', {
      params: { page, size, sort: 'id,desc' }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/deliveries/${id}`);
    return response.data;
  },

  getByOrderId: async (orderId) => {
    const response = await api.get(`/deliveries/order/${orderId}`);
    return response.data;
  },

  getByPersonnel: async (personnelId) => {
    const response = await api.get(`/deliveries/personnel/${personnelId}`);
    return response.data;
  },

  getByStatus: async (status) => {
    const response = await api.get(`/deliveries/status/${status}`);
    return response.data;
  },

  assignPersonnel: async (id, data) => {
    const response = await api.patch(`/deliveries/${id}/assign`, data);
    return response.data;
  },

  updateStatus: async (id, data) => {
    const response = await api.patch(`/deliveries/${id}/status`, data);
    return response.data;
  }
};

export default deliveryService;
