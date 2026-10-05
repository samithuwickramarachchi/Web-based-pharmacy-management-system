package com.pharmacy.delivery.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class DeliveryAssignRequest {

    @NotNull(message = "Delivery personnel ID is required")
    private Integer deliveryPersonnelId;

    private LocalDate scheduledDate;

    private String notes;

    public DeliveryAssignRequest() {}

    public Integer getDeliveryPersonnelId() { return deliveryPersonnelId; }
    public void setDeliveryPersonnelId(Integer deliveryPersonnelId) { this.deliveryPersonnelId = deliveryPersonnelId; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
