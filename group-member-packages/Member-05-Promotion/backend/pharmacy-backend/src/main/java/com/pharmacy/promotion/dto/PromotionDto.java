package com.pharmacy.promotion.dto;

import com.pharmacy.promotion.entity.DiscountType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public class PromotionDto {
    private Integer id;
    private String name;
    private String description;
    private String couponCode;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountCap;
    private Integer maxTotalUses;
    private Integer maxUsesPerCustomer;
    private Boolean appliesToAllProducts;
    private Boolean isActive;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Integer createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private Set<Integer> eligibleProductIds;
    private Long currentUsageCount;

    public PromotionDto() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

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

    public Integer getCreatedById() { return createdById; }
    public void setCreatedById(Integer createdById) { this.createdById = createdById; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Set<Integer> getEligibleProductIds() { return eligibleProductIds; }
    public void setEligibleProductIds(Set<Integer> eligibleProductIds) { this.eligibleProductIds = eligibleProductIds; }

    public Long getCurrentUsageCount() { return currentUsageCount; }
    public void setCurrentUsageCount(Long currentUsageCount) { this.currentUsageCount = currentUsageCount; }
}
