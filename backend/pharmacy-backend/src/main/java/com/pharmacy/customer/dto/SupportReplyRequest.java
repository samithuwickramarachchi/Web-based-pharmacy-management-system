package com.pharmacy.customer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SupportReplyRequest {

    @NotBlank(message = "Reply text is required")
    @Size(max = 3000, message = "Reply must not exceed 3000 characters")
    private String replyText;

    public SupportReplyRequest() {}

    public String getReplyText() {
        return replyText;
    }

    public void setReplyText(String replyText) {
        this.replyText = replyText;
    }
}
