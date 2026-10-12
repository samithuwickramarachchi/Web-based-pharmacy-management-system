package com.pharmacy.delivery.dto;

import com.pharmacy.delivery.entity.DeliveryStatus;
import java.time.LocalDateTime;

public class DeliveryStatusHistoryDto {
    private Long id;
    private Integer deliveryId;
    private DeliveryStatus status;
    private Integer changedById;
    private String changedByName;
    private LocalDateTime changedAt;
    private String notes;

    public DeliveryStatusHistoryDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getDeliveryId() { return deliveryId; }
    public void setDeliveryId(Integer deliveryId) { this.deliveryId = deliveryId; }

    public DeliveryStatus getStatus() { return status; }
    public void setStatus(DeliveryStatus status) { this.status = status; }

    public Integer getChangedById() { return changedById; }
    public void setChangedById(Integer changedById) { this.changedById = changedById; }

    public String getChangedByName() { return changedByName; }
    public void setChangedByName(String changedByName) { this.changedByName = changedByName; }

    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
