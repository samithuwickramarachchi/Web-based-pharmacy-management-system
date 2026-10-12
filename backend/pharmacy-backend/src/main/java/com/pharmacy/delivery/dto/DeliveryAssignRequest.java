package com.pharmacy.delivery.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class DeliveryAssignRequest {

    @NotNull(message = "Delivery officer ID is required")
    private Integer deliveryOfficerId;

    private LocalDate scheduledDate;

    private String notes;

    public DeliveryAssignRequest() {}

    public Integer getDeliveryOfficerId() { return deliveryOfficerId; }
    public void setDeliveryOfficerId(Integer deliveryOfficerId) { this.deliveryOfficerId = deliveryOfficerId; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
