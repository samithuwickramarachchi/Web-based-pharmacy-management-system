package com.pharmacy.sales.dto;

import com.pharmacy.sales.entity.SalePaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class SaleRequest {

    private Integer customerId;
    private Integer promotionId;

    @NotNull(message = "Subtotal is required")
    @DecimalMin("0.00")
    private BigDecimal subtotal;

    @DecimalMin("0.00")
    private BigDecimal discountAmount;

    @DecimalMin("0.00")
    private BigDecimal taxAmount;

    @NotNull(message = "Total amount is required")
    @DecimalMin("0.00")
    private BigDecimal totalAmount;

    private String notes;

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<SaleItemRequest> items;

    // Payment info
    @NotNull(message = "Payment method is required")
    private SalePaymentMethod paymentMethod;

    @NotNull(message = "Amount paid is required")
    @DecimalMin("0.00")
    private BigDecimal amountPaid;

    @DecimalMin("0.00")
    private BigDecimal changeGiven;

    private String paymentReference;

    public SaleRequest() {}

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public Integer getPromotionId() { return promotionId; }
    public void setPromotionId(Integer promotionId) { this.promotionId = promotionId; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<SaleItemRequest> getItems() { return items; }
    public void setItems(List<SaleItemRequest> items) { this.items = items; }

    public SalePaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(SalePaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

    public BigDecimal getChangeGiven() { return changeGiven; }
    public void setChangeGiven(BigDecimal changeGiven) { this.changeGiven = changeGiven; }

    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
}
