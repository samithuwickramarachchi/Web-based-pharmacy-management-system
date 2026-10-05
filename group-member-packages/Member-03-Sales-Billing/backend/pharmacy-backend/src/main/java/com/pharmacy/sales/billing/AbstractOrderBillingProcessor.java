package com.pharmacy.sales.billing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Abstract Class defining the Template Method for order billing calculations (Behavioral Pattern).
 * Subclasses specialize tax, discount rules, delivery charges, and validation.
 */
public abstract class AbstractOrderBillingProcessor<TOrderRequest> {

    /**
     * The Template Method defining the invariant algorithm skeleton for pharmacy billing.
     */
    public final OrderBillingSummary computeBilling(TOrderRequest request) {
        validateOrderRequest(request);

        BigDecimal subtotal = calculateSubtotal(request);
        List<String> rulesApplied = new ArrayList<>();

        BigDecimal discount = calculateDiscounts(request, subtotal, rulesApplied);
        BigDecimal netAmount = subtotal.subtract(discount).max(BigDecimal.ZERO);

        BigDecimal tax = calculateTaxes(request, netAmount, rulesApplied);
        BigDecimal deliveryFee = calculateDeliveryCharges(request, rulesApplied);

        BigDecimal finalTotal = netAmount.add(tax).add(deliveryFee).setScale(2, RoundingMode.HALF_UP);

        postBillingCheck(finalTotal);

        return new OrderBillingSummary(
                subtotal.setScale(2, RoundingMode.HALF_UP),
                discount.setScale(2, RoundingMode.HALF_UP),
                tax.setScale(2, RoundingMode.HALF_UP),
                deliveryFee.setScale(2, RoundingMode.HALF_UP),
                finalTotal,
                rulesApplied
        );
    }

    protected abstract void validateOrderRequest(TOrderRequest request);

    protected abstract BigDecimal calculateSubtotal(TOrderRequest request);

    protected abstract BigDecimal calculateDiscounts(TOrderRequest request, BigDecimal subtotal, List<String> rules);

    protected abstract BigDecimal calculateTaxes(TOrderRequest request, BigDecimal netAmount, List<String> rules);

    protected abstract BigDecimal calculateDeliveryCharges(TOrderRequest request, List<String> rules);

    protected void postBillingCheck(BigDecimal finalTotal) {
        // Hook method: default assertion
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Final billing total cannot be negative");
        }
    }
}
