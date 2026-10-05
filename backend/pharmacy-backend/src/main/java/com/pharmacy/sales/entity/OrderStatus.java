package com.pharmacy.sales.entity;

public enum OrderStatus {
    PENDING_PAYMENT,
    PAYMENT_FAILED,
    AWAITING_PRESCRIPTION,
    CONFIRMED,
    PROCESSING,
    READY_FOR_DELIVERY,
    OUT_FOR_DELIVERY,
    DELIVERED,
    CANCELLED,
    REFUNDED
}
