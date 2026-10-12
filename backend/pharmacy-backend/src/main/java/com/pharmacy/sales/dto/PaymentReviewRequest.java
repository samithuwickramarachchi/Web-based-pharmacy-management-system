package com.pharmacy.sales.dto;

import com.pharmacy.sales.entity.PaymentStatus;
import jakarta.validation.constraints.NotNull;

public class PaymentReviewRequest {

    @NotNull(message = "Payment status is required")
    private PaymentStatus status;

    private String failureReason;

    public PaymentReviewRequest() {
    }

    public PaymentReviewRequest(PaymentStatus status, String failureReason) {
        this.status = status;
        this.failureReason = failureReason;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }
}
