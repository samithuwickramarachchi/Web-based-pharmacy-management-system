package com.pharmacy.customer.strategy.loyalty;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Concrete Strategy for the baseline "Standard" loyalty tier.
 * Standard members earn 1 point per 100 LKR spent with 0% baseline member discount.
 */
@Component
@Order(3)
public class StandardLoyaltyTierStrategy implements LoyaltyTierStrategy {

    public static final String TIER_NAME = "Standard";
    private static final BigDecimal EARN_UNIT = new BigDecimal("100");

    @Override
    public String getTierName() {
        return TIER_NAME;
    }

    @Override
    public int getMinimumPoints() {
        return 0;
    }

    @Override
    public boolean qualifies(int points) {
        return points < 100;
    }

    @Override
    public BigDecimal getTierDiscountPercentage() {
        return BigDecimal.ZERO;
    }

    @Override
    public int calculateEarnedPoints(BigDecimal orderAmount) {
        if (orderAmount == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return orderAmount.divideToIntegralValue(EARN_UNIT).intValue();
    }
}
