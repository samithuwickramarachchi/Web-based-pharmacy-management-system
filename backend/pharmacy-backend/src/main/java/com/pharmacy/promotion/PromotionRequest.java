package com.pharmacy.promotion.dto;

import com.pharmacy.promotion.entity.DiscountType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public class PromotionRequest {

    @NotBlank(message = "Promotion name is required")
    @Size(max = 150, message = "Name must not exceed 150 characters")
    private String name;

    private String description;

    @Size(max = 50, message = "Coupon code must not exceed 50 characters")
    private String couponCode;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin("0.01")
    private BigDecimal discountValue;

    @DecimalMin("0.00")
    private BigDecimal minOrderAmount;

    @DecimalMin("0.00")
    private BigDecimal maxDiscountCap;

    private Integer maxTotalUses;

    private Integer maxUsesPerCustomer = 1;

    private Boolean appliesToAllProducts = true;

    private Boolean isActive = true;

    @NotNull(message = "Valid from date is required")
    private LocalDateTime validFrom;

    @NotNull(message = "Valid until date is required")
    private LocalDateTime validUntil;

    private Set<Integer> eligibleProductIds;

    public PromotionRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public DiscountType getDiscountType() { return discountType; }
    public void setDiscountType(DiscountType discountType) { this.discountType = discountType; }

    public BigDecimal getDiscountValue() { return discountValue; }
    public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }

    public BigDecimal getMinOrderAmount() { return minOrderAmount; }
    public void setMinOrderAmount(BigDecimal minOrderAmount) { this.minOrderAmount = minOrderAmount; }

    public BigDecimal getMaxDiscountCap() { return maxDiscountCap; }
    public void setMaxDiscountCap(BigDecimal maxDiscountCap) { this.maxDiscountCap = maxDiscountCap; }

    public Integer getMaxTotalUses() { return maxTotalUses; }
    public void setMaxTotalUses(Integer maxTotalUses) { this.maxTotalUses = maxTotalUses; }

    public Integer getMaxUsesPerCustomer() { return maxUsesPerCustomer; }
    public void setMaxUsesPerCustomer(Integer maxUsesPerCustomer) { this.maxUsesPerCustomer = maxUsesPerCustomer; }

    public Boolean getAppliesToAllProducts() { return appliesToAllProducts; }
    public void setAppliesToAllProducts(Boolean appliesToAllProducts) { this.appliesToAllProducts = appliesToAllProducts; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public LocalDateTime getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDateTime validFrom) { this.validFrom = validFrom; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public Set<Integer> getEligibleProductIds() { return eligibleProductIds; }
    public void setEligibleProductIds(Set<Integer> eligibleProductIds) { this.eligibleProductIds = eligibleProductIds; }
}
