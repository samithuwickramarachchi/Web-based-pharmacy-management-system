import api from './api';

const salesService = {
  // In-Store Sales (POS)
  getAllSales: async (page = 0, size = 15) => {
    const response = await api.get('/sales', {
      params: { page, size, sort: 'id,desc' }
    });
    return response.data;
  },

  getSaleById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  getSaleByNumber: async (saleNumber) => {
    const response = await api.get(`/sales/number/${saleNumber}`);
    return response.data;
  },

  createSale: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },

  getSalesByCustomer: async (customerId) => {
    const response = await api.get(`/sales/customer/${customerId}`);
    return response.data;
  },

  // Online Orders
  getAllOrders: async (page = 0, size = 15) => {
    const response = await api.get('/orders', {
      params: { page, size, sort: 'id,desc' }
    });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  getOrderByNumber: async (orderNumber) => {
    const response = await api.get(`/orders/number/${orderNumber}`);
    return response.data;
  },

  // Create order (JSON, no file)
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  getOrdersByStatus: async (status) => {
    const response = await api.get(`/orders/status/${status}`);
    return response.data;
  },

  // Shopping Cart
  getCart: async (customerId) => {
    const response = await api.get(`/cart/${customerId}`);
    return response.data;
  },

  addItemToCart: async (customerId, productId, quantity = 1) => {
    const response = await api.post(`/cart/${customerId}/items`, { productId, quantity });
    return response.data;
  },

  updateCartItemQuantity: async (customerId, itemId, quantity) => {
    const response = await api.put(`/cart/${customerId}/items/${itemId}`, null, {
      params: { quantity }
    });
    return response.data;
  },

  removeItemFromCart: async (customerId, itemId) => {
    const response = await api.delete(`/cart/${customerId}/items/${itemId}`);
    return response.data;
  },

  clearCart: async (customerId) => {
    const response = await api.delete(`/cart/${customerId}`);
    return response.data;
  },

  // Prescriptions
  getAllPrescriptions: async () => {
    const response = await api.get('/prescriptions');
    return response.data;
  },

  getPrescriptionById: async (id) => {
    const response = await api.get(`/prescriptions/${id}`);
    return response.data;
  },

  getPrescriptionByOrderId: async (orderId) => {
    const response = await api.get(`/prescriptions/order/${orderId}`);
    return response.data;
  },

  reviewPrescription: async (id, reviewData) => {
    const response = await api.patch(`/prescriptions/${id}/review`, reviewData);
    return response.data;
  },

  // Prescription file upload (standalone or linked to an order)
  uploadPrescriptionFile: async (file, orderId = null, customerId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (orderId != null) formData.append('orderId', orderId);
    if (customerId != null) formData.append('customerId', customerId);
    const response = await api.post('/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get prescription file as blob URL (for inline viewing)
  getPrescriptionFileUrl: (prescriptionId) => `/api/prescriptions/${prescriptionId}/file`,

  getPrescriptionsByCustomer: async (customerId) => {
    const response = await api.get(`/prescriptions/customer/${customerId}`);
    return response.data;
  },

  // Order creation with prescription file (multipart)
  createOrderWithPrescription: async (orderData, prescriptionFile = null) => {
    const formData = new FormData();
    formData.append('order', new Blob([JSON.stringify(orderData)], { type: 'application/json' }));
    if (prescriptionFile) {
      formData.append('prescriptionFile', prescriptionFile);
    }
    const response = await api.post('/orders', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Payment slip upload for an order
  uploadPaymentSlip: async (orderId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/orders/${orderId}/payment-slip`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get payment slip as blob URL
  getPaymentSlipUrl: (orderId) => `/api/orders/${orderId}/payment-slip`,

  // Get payment details for an order
  getPaymentByOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/payment`);
    return response.data;
  },

  // Staff: review a payment (approve/reject)
  reviewPayment: async (orderId, reviewData) => {
    const response = await api.patch(`/orders/${orderId}/payment/review`, reviewData);
    return response.data;
  },

  // Customer's own orders
  getOrdersByCustomer: async (customerId, params = {}) => {
    const response = await api.get(`/orders/customer/${customerId}`, { params });
    return response.data;
  },
};

export default salesService;
