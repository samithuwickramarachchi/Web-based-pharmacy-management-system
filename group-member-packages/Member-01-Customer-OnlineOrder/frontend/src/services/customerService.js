import api from './api';

const customerService = {
  getAll: async (page = 0, size = 10) => {
    const response = await api.get('/customers', {
      params: { page, size, sort: 'id,desc' }
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/customers/me');
    return response.data;
  },

  updateProfile: async (id, data) => {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data;
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  changePassword: async (id, data) => {
    const response = await api.patch(`/customers/${id}/change-password`, data);
    return response.data;
  },

  getAddresses: async (id) => {
    const response = await api.get(`/customers/${id}/addresses`);
    return response.data;
  },

  addAddress: async (id, data) => {
    const response = await api.post(`/customers/${id}/addresses`, data);
    return response.data;
  },

  updateAddress: async (id, addressId, data) => {
    const response = await api.put(`/customers/${id}/addresses/${addressId}`, data);
    return response.data;
  },

  deleteAddress: async (id, addressId) => {
    const response = await api.delete(`/customers/${id}/addresses/${addressId}`);
    return response.data;
  },

  setDefaultAddress: async (id, addressId) => {
    const response = await api.patch(`/customers/${id}/addresses/${addressId}/default`);
    return response.data;
  },

  search: async (params) => {
    const response = await api.get('/customers/search', { params });
    return response.data;
  },

  submitSupportMessage: async (data) => {
    const response = await api.post('/support-messages', data);
    return response.data;
  },

  getMySupportMessages: async () => {
    const response = await api.get('/support-messages/my');
    return response.data;
  },

  getAllSupportMessages: async (page = 0, size = 10) => {
    const response = await api.get('/support-messages', { params: { page, size } });
    return response.data;
  },

  getSupportMessagesByCustomer: async (customerId) => {
    const response = await api.get(`/support-messages/customer/${customerId}`);
    return response.data;
  },

  replySupportMessage: async (messageId, replyText) => {
    const response = await api.post(`/support-messages/${messageId}/reply`, { replyText });
    return response.data;
  }
};

export default customerService;

