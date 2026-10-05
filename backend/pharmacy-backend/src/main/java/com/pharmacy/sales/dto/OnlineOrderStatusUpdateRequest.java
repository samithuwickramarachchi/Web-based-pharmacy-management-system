package com.pharmacy.sales.dto;

import com.pharmacy.sales.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class OnlineOrderStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private OrderStatus status;

    public OnlineOrderStatusUpdateRequest() {}

    public OnlineOrderStatusUpdateRequest(OrderStatus status) {
        this.status = status;
    }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
}
