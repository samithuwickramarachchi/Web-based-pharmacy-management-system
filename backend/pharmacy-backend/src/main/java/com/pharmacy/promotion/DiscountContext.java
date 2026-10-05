package com.pharmacy.promotion.strategy;

import com.pharmacy.promotion.entity.DiscountType;
import com.pharmacy.promotion.entity.Promotion;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Context class in the Strategy Pattern for discount calculations.
 * Dynamically resolves and invokes the appropriate DiscountStrategy.
 */
@Component
public class DiscountContext {

    private final Map<DiscountType, DiscountStrategy> strategies = new EnumMap<>(DiscountType.class);

    public DiscountContext(List<DiscountStrategy> strategyList) {
        for (DiscountStrategy s : strategyList) {
            strategies.put(s.getSupportedDiscountType(), s);
        }
    }

    /**
     * Executes the appropriate discount strategy for the given promotion and order amount.
     */
    public BigDecimal calculate(Promotion promotion, BigDecimal orderAmount) {
        if (promotion == null || orderAmount == null || orderAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        DiscountType type = promotion.getDiscountType();
        DiscountStrategy strategy = strategies.get(type);

        if (strategy == null) {
            // Default fallback: percentage if type is null
            strategy = strategies.get(DiscountType.PERCENTAGE);
        }

        if (strategy == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return strategy.calculateDiscount(orderAmount, promotion.getDiscountValue(), promotion.getMaxDiscountCap());
    }

    /**
     * Allows custom strategy invocation directly by discount parameters.
     */
    public BigDecimal calculate(DiscountType type, BigDecimal orderAmount, BigDecimal discountValue, BigDecimal maxDiscountCap) {
        DiscountStrategy strategy = strategies.get(type);
        if (strategy == null) {
            strategy = strategies.get(DiscountType.PERCENTAGE);
        }
        if (strategy == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return strategy.calculateDiscount(orderAmount, discountValue, maxDiscountCap);
    }
}
