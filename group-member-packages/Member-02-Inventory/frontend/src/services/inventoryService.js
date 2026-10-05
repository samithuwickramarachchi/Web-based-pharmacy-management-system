import api from './api';

const inventoryService = {
  // Products
  getProducts: async (page = 0, size = 15) => {
    const response = await api.get('/inventory/products', {
      params: { page, size, sort: 'id,desc' }
    });
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/inventory/products/${id}`);
    return response.data;
  },

  getProductsByCategory: async (categoryId) => {
    const response = await api.get(`/inventory/products/category/${categoryId}`);
    return response.data;
  },

  getLowStockProducts: async () => {
    const response = await api.get('/inventory/products/low-stock');
    return response.data;
  },

  createProduct: async (data) => {
    const response = await api.post('/inventory/products', data);
    return response.data;
  },

  updateProduct: async (id, data) => {
    const response = await api.put(`/inventory/products/${id}`, data);
    return response.data;
  },

  deactivateProduct: async (id) => {
    const response = await api.patch(`/inventory/products/${id}/deactivate`);
    return response.data;
  },

  // Batches
  getBatches: async (productId) => {
    const response = await api.get(`/inventory/products/${productId}/batches`);
    return response.data;
  },

  createBatch: async (productId, data) => {
    const response = await api.post(`/inventory/products/${productId}/batches`, data);
    return response.data;
  },

  updateBatch: async (productId, batchId, data) => {
    const response = await api.put(`/inventory/products/${productId}/batches/${batchId}`, data);
    return response.data;
  },

  adjustStock: async (productId, batchId, data) => {
    const response = await api.post(`/inventory/products/${productId}/batches/${batchId}/adjust`, data);
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await api.get('/inventory/categories');
    return response.data;
  },

  createCategory: async (data) => {
    const response = await api.post('/inventory/categories', data);
    return response.data;
  },

  updateCategory: async (id, data) => {
    const response = await api.put(`/inventory/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/inventory/categories/${id}`);
    return response.data;
  },

  // Manufacturers
  getManufacturers: async () => {
    const response = await api.get('/inventory/manufacturers');
    return response.data;
  },

  createManufacturer: async (data) => {
    const response = await api.post('/inventory/manufacturers', data);
    return response.data;
  },

  updateManufacturer: async (id, data) => {
    const response = await api.put(`/inventory/manufacturers/${id}`, data);
    return response.data;
  },

  deleteManufacturer: async (id) => {
    const response = await api.delete(`/inventory/manufacturers/${id}`);
    return response.data;
  }
};

export default inventoryService;
