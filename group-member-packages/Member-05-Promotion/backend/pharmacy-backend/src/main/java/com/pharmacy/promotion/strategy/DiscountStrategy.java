package com.pharmacy.promotion.strategy;

import com.pharmacy.promotion.entity.DiscountType;
import java.math.BigDecimal;

/**
 * Strategy interface for discount calculation algorithms (Behavioral Pattern).
 */
public interface DiscountStrategy {

    DiscountType getSupportedDiscountType();

    BigDecimal calculateDiscount(BigDecimal orderAmount, BigDecimal discountValue, BigDecimal maxDiscountCap);
}
