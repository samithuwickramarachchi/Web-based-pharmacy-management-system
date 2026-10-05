package com.pharmacy.sales.dto;

import com.pharmacy.sales.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OnlineOrderResponse {
    private Integer id;
    private String orderNumber;
    private Integer customerId;
    private String customerName;
    private String customerEmail;
    private Integer promotionId;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String deliveryAddress;
    private Boolean requiresPrescription;
    private String notes;
    private String fulfillmentType;
    private LocalDateTime placedAt;
    private LocalDateTime updatedAt;
    private List<OnlineOrderItemDto> items;
    private PaymentDto payment;
    private PrescriptionResponse prescription;
    private Integer deliveryId;
    private String deliveryStatus;
    private Boolean loyaltyPointsAwarded;

    public OnlineOrderResponse() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public Integer getPromotionId() { return promotionId; }
    public void setPromotionId(Integer promotionId) { this.promotionId = promotionId; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public Boolean getRequiresPrescription() { return requiresPrescription; }
    public void setRequiresPrescription(Boolean requiresPrescription) { this.requiresPrescription = requiresPrescription; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getFulfillmentType() { return fulfillmentType; }
    public void setFulfillmentType(String fulfillmentType) { this.fulfillmentType = fulfillmentType; }

    public LocalDateTime getPlacedAt() { return placedAt; }
    public void setPlacedAt(LocalDateTime placedAt) { this.placedAt = placedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<OnlineOrderItemDto> getItems() { return items; }
    public void setItems(List<OnlineOrderItemDto> items) { this.items = items; }

    public PaymentDto getPayment() { return payment; }
    public void setPayment(PaymentDto payment) { this.payment = payment; }

    public PrescriptionResponse getPrescription() { return prescription; }
    public void setPrescription(PrescriptionResponse prescription) { this.prescription = prescription; }

    public Integer getDeliveryId() { return deliveryId; }
    public void setDeliveryId(Integer deliveryId) { this.deliveryId = deliveryId; }

    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public Boolean getLoyaltyPointsAwarded() { return loyaltyPointsAwarded; }
    public void setLoyaltyPointsAwarded(Boolean loyaltyPointsAwarded) { this.loyaltyPointsAwarded = loyaltyPointsAwarded; }
}
