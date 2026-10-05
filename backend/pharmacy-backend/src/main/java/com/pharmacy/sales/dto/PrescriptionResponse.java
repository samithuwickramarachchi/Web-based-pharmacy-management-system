package com.pharmacy.sales.dto;

import com.pharmacy.sales.entity.PrescriptionStatus;
import java.time.LocalDateTime;

public class PrescriptionResponse {
    private Integer id;
    private Integer onlineOrderId;
    private String orderNumber;
    private Integer customerId;
    private String customerName;
    private String filePath;
    private String originalFilename;
    private PrescriptionStatus status;
    private LocalDateTime uploadedAt;
    private Integer reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String reviewNotes;

    public PrescriptionResponse() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getOnlineOrderId() { return onlineOrderId; }
    public void setOnlineOrderId(Integer onlineOrderId) { this.onlineOrderId = onlineOrderId; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public PrescriptionStatus getStatus() { return status; }
    public void setStatus(PrescriptionStatus status) { this.status = status; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public Integer getReviewedById() { return reviewedById; }
    public void setReviewedById(Integer reviewedById) { this.reviewedById = reviewedById; }

    public String getReviewedByName() { return reviewedByName; }
    public void setReviewedByName(String reviewedByName) { this.reviewedByName = reviewedByName; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public String getReviewNotes() { return reviewNotes; }
    public void setReviewNotes(String reviewNotes) { this.reviewNotes = reviewNotes; }
}
