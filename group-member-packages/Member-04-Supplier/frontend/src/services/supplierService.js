import api from './api';

const supplierService = {
  // Suppliers Directory
  getAllSuppliers: async (page = 0, size = 15) => {
    const response = await api.get('/suppliers', {
      params: { page, size, sort: 'id,desc' }
    });
    return response.data;
  },

  getActiveSuppliers: async () => {
    const response = await api.get('/suppliers/active');
    return response.data;
  },

  getSupplierById: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  updateSupplier: async (id, data) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  deleteSupplier: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },

  // Purchase Orders
  getAllPurchaseOrders: async (page = 0, size = 15) => {
    const response = await api.get('/purchase-orders', {
      params: { page, size, sort: 'id,desc' }
    });
    return response.data;
  },

  getPurchaseOrderById: async (id) => {
    const response = await api.get(`/purchase-orders/${id}`);
    return response.data;
  },

  getPurchaseOrderByPoNumber: async (poNumber) => {
    const response = await api.get(`/purchase-orders/number/${poNumber}`);
    return response.data;
  },

  getPurchaseOrdersBySupplier: async (supplierId) => {
    const response = await api.get(`/purchase-orders/supplier/${supplierId}`);
    return response.data;
  },

  getPurchaseOrdersByStatus: async (status) => {
    const response = await api.get(`/purchase-orders/status/${status}`);
    return response.data;
  },

  createPurchaseOrder: async (data) => {
    const response = await api.post('/purchase-orders', data);
    return response.data;
  },

  updatePurchaseOrderStatus: async (id, status) => {
    const response = await api.patch(`/purchase-orders/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  receiveStock: async (id, data) => {
    const response = await api.post(`/purchase-orders/${id}/receive`, data);
    return response.data;
  }
};

export default supplierService;
