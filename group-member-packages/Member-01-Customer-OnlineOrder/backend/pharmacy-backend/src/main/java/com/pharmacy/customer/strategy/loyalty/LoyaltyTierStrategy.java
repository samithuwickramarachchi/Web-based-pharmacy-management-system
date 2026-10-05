package com.pharmacy.customer.strategy.loyalty;

import java.math.BigDecimal;

/**
 * Strategy Pattern interface for Customer Loyalty Tier calculation and rewards.
 * Encapsulates tier qualification rules, points earning rates, and membership discounts.
 */
public interface LoyaltyTierStrategy {

    /**
     * Unique identifier/name of the tier (e.g. "Standard", "Silver", "Gold").
     */
    String getTierName();

    /**
     * Minimum loyalty points threshold to qualify for this tier.
     */
    int getMinimumPoints();

    /**
     * Checks if the given total loyalty points qualifies for this tier.
     */
    boolean qualifies(int points);

    /**
     * Member discount percentage (e.g. 0% for Standard, 5% for Silver, 10% for Gold).
     */
    BigDecimal getTierDiscountPercentage();

    /**
     * Calculates the number of loyalty points earned from a completed purchase amount.
     *
     * @param orderAmount the total eligible spending amount
     * @return the number of points earned
     */
    int calculateEarnedPoints(BigDecimal orderAmount);
}
