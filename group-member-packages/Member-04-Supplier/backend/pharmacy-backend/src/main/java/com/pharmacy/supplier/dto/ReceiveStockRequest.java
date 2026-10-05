package com.pharmacy.supplier.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class ReceiveStockRequest {

    @NotEmpty(message = "At least one item must be received")
    @Valid
    private List<ReceiveStockItemRequest> items;

    public ReceiveStockRequest() {}

    public ReceiveStockRequest(List<ReceiveStockItemRequest> items) {
        this.items = items;
    }

    public List<ReceiveStockItemRequest> getItems() { return items; }
    public void setItems(List<ReceiveStockItemRequest> items) { this.items = items; }
}
