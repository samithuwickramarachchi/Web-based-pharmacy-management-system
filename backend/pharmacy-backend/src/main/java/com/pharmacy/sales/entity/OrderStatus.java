package com.pharmacy.sales.entity;

public enum OrderStatus {
    PENDING_PAYMENT,
    PAYMENT_FAILED,
    AWAITING_PRESCRIPTION,
    CONFIRMED,
    PROCESSING,
    // Home-delivery path (handled together with the Delivery Management module)
    READY_FOR_DELIVERY,
    OUT_FOR_DELIVERY,
    DELIVERED,
    // Store-pickup path (Sales & Billing only - never touches Delivery Management)
    READY_FOR_PICKUP,
    COLLECTED,
    CANCELLED,
    REFUNDED
}
