package com.pharmacy.promotion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class CouponValidateRequest {

    @NotBlank(message = "Coupon code is required")
    private String couponCode;

    @NotNull(message = "Order amount is required")
    @DecimalMin("0.00")
    private BigDecimal orderAmount;

    private Integer customerId;

    public CouponValidateRequest() {}

    public CouponValidateRequest(String couponCode, BigDecimal orderAmount, Integer customerId) {
        this.couponCode = couponCode;
        this.orderAmount = orderAmount;
        this.customerId = customerId;
    }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public BigDecimal getOrderAmount() { return orderAmount; }
    public void setOrderAmount(BigDecimal orderAmount) { this.orderAmount = orderAmount; }

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }
}
