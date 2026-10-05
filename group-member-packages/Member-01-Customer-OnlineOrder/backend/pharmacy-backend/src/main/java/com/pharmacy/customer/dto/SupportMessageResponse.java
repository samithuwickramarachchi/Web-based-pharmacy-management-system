package com.pharmacy.customer.dto;

import java.time.LocalDateTime;

public class SupportMessageResponse {
    private Integer id;
    private Integer customerId;
    private String customerName;
    private String customerEmail;
    private String subject;
    private String message;
    private LocalDateTime createdAt;

    // ── Staff Reply ───────────────────────────────────────────────────────────
    private String replyText;
    private LocalDateTime replyAt;
    private String repliedByName;

    public SupportMessageResponse() {}

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getReplyText() {
        return replyText;
    }

    public void setReplyText(String replyText) {
        this.replyText = replyText;
    }

    public LocalDateTime getReplyAt() {
        return replyAt;
    }

    public void setReplyAt(LocalDateTime replyAt) {
        this.replyAt = replyAt;
    }

    public String getRepliedByName() {
        return repliedByName;
    }

    public void setRepliedByName(String repliedByName) {
        this.repliedByName = repliedByName;
    }
}
