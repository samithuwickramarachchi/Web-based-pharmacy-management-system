package com.pharmacy.sales.billing;

import java.math.BigDecimal;
import java.util.List;

/**
 * Encapsulates the calculated billing summary in the Template Method Pattern.
 */
public class OrderBillingSummary {

    private final BigDecimal subtotal;
    private final BigDecimal discountAmount;
    private final BigDecimal taxAmount;
    private final BigDecimal deliveryFee;
    private final BigDecimal finalTotal;
    private final List<String> appliedRules;

    public OrderBillingSummary(BigDecimal subtotal, BigDecimal discountAmount, BigDecimal taxAmount,
                               BigDecimal deliveryFee, BigDecimal finalTotal, List<String> appliedRules) {
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.taxAmount = taxAmount;
        this.deliveryFee = deliveryFee;
        this.finalTotal = finalTotal;
        this.appliedRules = appliedRules != null ? appliedRules : List.of();
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public BigDecimal getFinalTotal() {
        return finalTotal;
    }

    public List<String> getAppliedRules() {
        return appliedRules;
    }
}
