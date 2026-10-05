package com.pharmacy.promotion.dto;

import com.pharmacy.promotion.entity.DiscountType;
import java.math.BigDecimal;

public class CouponValidateResponse {
    private boolean valid;
    private Integer promotionId;
    private String couponCode;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal calculatedDiscount;
    private BigDecimal finalAmount;
    private String message;

    public CouponValidateResponse() {}

    public static CouponValidateResponse invalid(String message) {
        CouponValidateResponse res = new CouponValidateResponse();
        res.setValid(false);
        res.setMessage(message);
        res.setCalculatedDiscount(BigDecimal.ZERO);
        return res;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public Integer getPromotionId() { return promotionId; }
    public void setPromotionId(Integer promotionId) { this.promotionId = promotionId; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public DiscountType getDiscountType() { return discountType; }
    public void setDiscountType(DiscountType discountType) { this.discountType = discountType; }

    public BigDecimal getDiscountValue() { return discountValue; }
    public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }

    public BigDecimal getCalculatedDiscount() { return calculatedDiscount; }
    public void setCalculatedDiscount(BigDecimal calculatedDiscount) { this.calculatedDiscount = calculatedDiscount; }

    public BigDecimal getFinalAmount() { return finalAmount; }
    public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
