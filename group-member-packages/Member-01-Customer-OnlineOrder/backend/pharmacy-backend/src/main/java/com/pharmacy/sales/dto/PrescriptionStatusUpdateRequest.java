package com.pharmacy.sales.dto;

import com.pharmacy.sales.entity.PrescriptionStatus;
import jakarta.validation.constraints.NotNull;

public class PrescriptionStatusUpdateRequest {

    @NotNull(message = "Prescription status is required")
    private PrescriptionStatus status;

    private String reviewNotes;

    public PrescriptionStatusUpdateRequest() {}

    public PrescriptionStatusUpdateRequest(PrescriptionStatus status, String reviewNotes) {
        this.status = status;
        this.reviewNotes = reviewNotes;
    }

    public PrescriptionStatus getStatus() { return status; }
    public void setStatus(PrescriptionStatus status) { this.status = status; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }
}
