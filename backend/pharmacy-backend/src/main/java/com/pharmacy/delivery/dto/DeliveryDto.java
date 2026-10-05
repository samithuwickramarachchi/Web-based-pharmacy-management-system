package com.pharmacy.delivery.dto;

import com.pharmacy.delivery.entity.DeliveryStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class DeliveryDto {
    private Integer id;
    private Integer onlineOrderId;
    private String orderNumber;
    private String customerName;
    private String customerPhone;
    private Integer deliveryPersonnelId;
    private String deliveryPersonnelName;
    private String deliveryAddress;
    private DeliveryStatus status;
    private LocalDate scheduledDate;
    private LocalDateTime deliveredAt;
    private String proofOfDelivery;
    private String failureReason;
    private String delayNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DeliveryStatusHistoryDto> history;

    public DeliveryDto() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getOnlineOrderId() { return onlineOrderId; }
    public void setOnlineOrderId(Integer onlineOrderId) { this.onlineOrderId = onlineOrderId; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public Integer getDeliveryPersonnelId() { return deliveryPersonnelId; }
    public void setDeliveryPersonnelId(Integer deliveryPersonnelId) { this.deliveryPersonnelId = deliveryPersonnelId; }

    public String getDeliveryPersonnelName() { return deliveryPersonnelName; }
    public void setDeliveryPersonnelName(String deliveryPersonnelName) { this.deliveryPersonnelName = deliveryPersonnelName; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public DeliveryStatus getStatus() { return status; }
    public void setStatus(DeliveryStatus status) { this.status = status; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public String getProofOfDelivery() { return proofOfDelivery; }
    public void setProofOfDelivery(String proofOfDelivery) { this.proofOfDelivery = proofOfDelivery; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getDelayNotes() { return delayNotes; }
    public void setDelayNotes(String delayNotes) { this.delayNotes = delayNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<DeliveryStatusHistoryDto> getHistory() { return history; }
    public void setHistory(List<DeliveryStatusHistoryDto> history) { this.history = history; }
}
