package com.pharmacy.sales.billing;

import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.sales.dto.SaleItemRequest;
import com.pharmacy.sales.dto.SaleRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Concrete implementation of AbstractOrderBillingProcessor for POS Counter Sales.
 */
@Component
public class PosSaleBillingProcessor extends AbstractOrderBillingProcessor<SaleRequest> {

    @Override
    protected void validateOrderRequest(SaleRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException("Sale request must contain at least one item");
        }
    }

    @Override
    protected BigDecimal calculateSubtotal(SaleRequest request) {
        BigDecimal sum = BigDecimal.ZERO;
        for (SaleItemRequest item : request.getItems()) {
            BigDecimal line = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            sum = sum.add(line);
        }
        return sum;
    }

    @Override
    protected BigDecimal calculateDiscounts(SaleRequest request, BigDecimal subtotal, List<String> rules) {
        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        if (discount.compareTo(BigDecimal.ZERO) > 0) {
            rules.add("Manual/Promotional discount: " + discount);
        }
        return discount.min(subtotal);
    }

    @Override
    protected BigDecimal calculateTaxes(SaleRequest request, BigDecimal netAmount, List<String> rules) {
        BigDecimal tax = request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO;
        if (tax.compareTo(BigDecimal.ZERO) > 0) {
            rules.add("POS Tax: " + tax);
        }
        return tax;
    }

    @Override
    protected BigDecimal calculateDeliveryCharges(SaleRequest request, List<String> rules) {
        return BigDecimal.ZERO; // Over-the-counter sales have zero delivery fee
    }
}
