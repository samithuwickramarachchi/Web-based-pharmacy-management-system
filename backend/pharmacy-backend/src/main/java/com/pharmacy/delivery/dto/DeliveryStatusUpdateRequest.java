package com.pharmacy.delivery.dto;

import com.pharmacy.delivery.entity.DeliveryStatus;
import jakarta.validation.constraints.NotNull;

public class DeliveryStatusUpdateRequest {

    @NotNull(message = "Delivery status is required")
    private DeliveryStatus status;

    private String notes;
    private String proofOfDelivery;
    private String failureReason;
    private String delayNotes;

    public DeliveryStatusUpdateRequest() {}

    public DeliveryStatus getStatus() { return status; }
    public void setStatus(DeliveryStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getProofOfDelivery() { return proofOfDelivery; }
    public void setProofOfDelivery(String proofOfDelivery) { this.proofOfDelivery = proofOfDelivery; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getDelayNotes() { return delayNotes; }
    public void setDelayNotes(String delayNotes) { this.delayNotes = delayNotes; }
}
