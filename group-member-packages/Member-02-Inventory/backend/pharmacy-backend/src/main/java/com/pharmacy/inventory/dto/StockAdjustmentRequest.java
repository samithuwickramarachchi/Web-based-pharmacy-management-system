package com.pharmacy.inventory.dto;

import jakarta.validation.constraints.NotNull;

public class StockAdjustmentRequest {

    @NotNull(message = "Quantity delta is required")
    private Integer quantityDelta;

    private String reason;

    public StockAdjustmentRequest() {}

    public Integer getQuantityDelta() { return quantityDelta; }
    public void setQuantityDelta(Integer quantityDelta) { this.quantityDelta = quantityDelta; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
