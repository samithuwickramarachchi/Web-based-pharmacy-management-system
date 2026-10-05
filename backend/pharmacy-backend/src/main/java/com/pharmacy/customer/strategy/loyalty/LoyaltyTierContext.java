package com.pharmacy.customer.strategy.loyalty;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Strategy Pattern Context for customer loyalty tier calculations.
 * Resolves the appropriate {@link LoyaltyTierStrategy} based on current points or tier name,
 * and calculates reward points and discount rates dynamically.
 */
@Component
public class LoyaltyTierContext {

    private static final Logger log = LoggerFactory.getLogger(LoyaltyTierContext.class);

    private final List<LoyaltyTierStrategy> strategies;
    private final Map<String, LoyaltyTierStrategy> strategyMap = new ConcurrentHashMap<>();

    public LoyaltyTierContext(List<LoyaltyTierStrategy> strategies) {
        this.strategies = strategies;
        for (LoyaltyTierStrategy s : strategies) {
            strategyMap.put(s.getTierName().toLowerCase(), s);
        }
        log.info("Initialized LoyaltyTierContext with {} tier strategies", strategies.size());
    }

    /**
     * Determines the appropriate LoyaltyTierStrategy for the given loyalty points count.
     */
    public LoyaltyTierStrategy determineStrategy(int points) {
        for (LoyaltyTierStrategy strategy : strategies) {
            if (strategy.qualifies(points)) {
                return strategy;
            }
        }
        // Fallback to Standard
        return strategyMap.getOrDefault(StandardLoyaltyTierStrategy.TIER_NAME.toLowerCase(),
                strategies.isEmpty() ? null : strategies.get(strategies.size() - 1));
    }

    /**
     * Returns the name of the tier for the given points.
     */
    public String determineTierName(int points) {
        LoyaltyTierStrategy strategy = determineStrategy(points);
        return strategy != null ? strategy.getTierName() : StandardLoyaltyTierStrategy.TIER_NAME;
    }

    /**
     * Retrieves the strategy by tier name.
     */
    public LoyaltyTierStrategy getStrategy(String tierName) {
        if (tierName == null) {
            return determineStrategy(0);
        }
        LoyaltyTierStrategy strategy = strategyMap.get(tierName.trim().toLowerCase());
        return strategy != null ? strategy : determineStrategy(0);
    }

    /**
     * Calculates points earned for a purchase given the customer's current tier name and order amount.
     */
    public int calculateEarnedPoints(String tierName, BigDecimal orderAmount) {
        LoyaltyTierStrategy strategy = getStrategy(tierName);
        return strategy != null ? strategy.calculateEarnedPoints(orderAmount) : 0;
    }

    /**
     * Gets the member discount rate percentage for the specified tier.
     */
    public BigDecimal getTierDiscountPercentage(String tierName) {
        LoyaltyTierStrategy strategy = getStrategy(tierName);
        return strategy != null ? strategy.getTierDiscountPercentage() : BigDecimal.ZERO;
    }
}
