package com.pharmacy.customer.strategy.loyalty;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Concrete Strategy for the "Gold" loyalty tier.
 * Gold members have >= 500 points, receive 10% member discount,
 * and earn 2x loyalty points (1 point per 50 LKR).
 */
@Component
@Order(1)
public class GoldLoyaltyTierStrategy implements LoyaltyTierStrategy {

    public static final String TIER_NAME = "Gold";
    private static final BigDecimal EARN_UNIT = new BigDecimal("50");
    private static final BigDecimal DISCOUNT_RATE = new BigDecimal("10.00");

    @Override
    public String getTierName() {
        return TIER_NAME;
    }

    @Override
    public int getMinimumPoints() {
        return 500;
    }

    @Override
    public boolean qualifies(int points) {
        return points >= 500;
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
