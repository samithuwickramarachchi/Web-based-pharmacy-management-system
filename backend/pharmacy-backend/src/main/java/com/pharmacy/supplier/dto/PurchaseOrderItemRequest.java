package com.pharmacy.supplier.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PurchaseOrderItemRequest {

    @NotNull(message = "Product ID is required")
    private Integer productId;

    @NotNull(message = "Quantity ordered is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantityOrdered;

    @NotNull(message = "Unit cost is required")
    @DecimalMin(value = "0.00", message = "Unit cost must be non-negative")
    private BigDecimal unitCost;

    public PurchaseOrderItemRequest() {}

    public PurchaseOrderItemRequest(Integer productId, Integer quantityOrdered, BigDecimal unitCost) {
        this.productId = productId;
        this.quantityOrdered = quantityOrdered;
        this.unitCost = unitCost;
    }

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public Integer getQuantityOrdered() { return quantityOrdered; }
    public void setQuantityOrdered(Integer quantityOrdered) { this.quantityOrdered = quantityOrdered; }

    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
}
