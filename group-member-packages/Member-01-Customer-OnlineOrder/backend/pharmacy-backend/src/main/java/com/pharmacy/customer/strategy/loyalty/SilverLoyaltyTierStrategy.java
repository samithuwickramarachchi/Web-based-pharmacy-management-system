package com.pharmacy.customer.strategy.loyalty;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Concrete Strategy for the "Silver" loyalty tier.
 * Silver members have >= 100 points, receive 5% member discount,
 * and earn 1.25x loyalty points (1 point per 80 LKR).
 */
@Component
@Order(2)
public class SilverLoyaltyTierStrategy implements LoyaltyTierStrategy {

    public static final String TIER_NAME = "Silver";
    private static final BigDecimal EARN_UNIT = new BigDecimal("80");
    private static final BigDecimal DISCOUNT_RATE = new BigDecimal("5.00");

    @Override
    public String getTierName() {
        return TIER_NAME;
    }

    @Override
    public int getMinimumPoints() {
        return 100;
    }

    @Override
    public boolean qualifies(int points) {
        return points >= 100 && points < 500;
    }

    @Override
    public BigDecimal getTierDiscountPercentage() {
        return DISCOUNT_RATE;
    }

    @Override
    public int calculateEarnedPoints(BigDecimal orderAmount) {
        if (orderAmount == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        return orderAmount.divideToIntegralValue(EARN_UNIT).intValue();
    }
}
