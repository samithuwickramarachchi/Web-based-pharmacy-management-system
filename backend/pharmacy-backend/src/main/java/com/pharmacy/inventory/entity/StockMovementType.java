package com.pharmacy.inventory.entity;

public enum StockMovementType {
    PURCHASE_IN,
    SALE_OUT,
    ONLINE_SALE_OUT,
    ADJUSTMENT_IN,
    ADJUSTMENT_OUT,
    RETURN_IN,
    EXPIRY_WRITEOFF,
    TRANSFER
}
