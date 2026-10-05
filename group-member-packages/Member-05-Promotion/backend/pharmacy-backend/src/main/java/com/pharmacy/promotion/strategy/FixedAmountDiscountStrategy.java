package com.pharmacy.promotion.strategy;

import com.pharmacy.promotion.entity.DiscountType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Concrete strategy implementing fixed amount discount calculation.
 */
@Component
public class FixedAmountDiscountStrategy implements DiscountStrategy {

    @Override
    public DiscountType getSupportedDiscountType() {
        return DiscountType.FIXED_AMOUNT;
    }

    @Override
    public BigDecimal calculateDiscount(BigDecimal orderAmount, BigDecimal discountValue, BigDecimal maxDiscountCap) {
        if (orderAmount == null || discountValue == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal discount = discountValue;

        if (maxDiscountCap != null && discount.compareTo(maxDiscountCap) > 0) {
            discount = maxDiscountCap;
        }

        discount = discount.min(orderAmount).setScale(2, RoundingMode.HALF_UP);
        return discount.max(BigDecimal.ZERO);
    }
}
