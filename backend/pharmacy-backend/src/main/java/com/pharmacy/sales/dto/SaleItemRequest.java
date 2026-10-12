package com.pharmacy.sales.dto;

import com.pharmacy.sales.entity.SalePaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class SaleItemRequest {

    @NotNull(message = "Product ID is required")
    private Integer productId;

    @NotNull(message = "Batch ID is required")
    private Integer batchId;

    @NotNull(message = "Quantity is required")
    private Integer quantity;

    @NotNull(message = "Unit price is required")
    @DecimalMin("0.00")
    private BigDecimal unitPrice;

    @DecimalMin("0.00")
    private BigDecimal discountAmount;

    public SaleItemRequest() {}

    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }

    public Integer getBatchId() { return batchId; }
    public void setBatchId(Integer batchId) { this.batchId = batchId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
}
