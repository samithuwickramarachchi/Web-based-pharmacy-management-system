package com.pharmacy.sales.strategy.payment;

import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.PaymentStatus;
import com.pharmacy.sales.entity.SalePaymentMethod;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Concrete strategy for cash payment transactions at POS or counter.
 */
@Component
public class CashPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentProcessResult processPayment(PaymentProcessingContext context) {
        BigDecimal total = context.getTotalAmount();
        BigDecimal tendered = context.getAmountTendered() != null ? context.getAmountTendered() : total;

        if (tendered.compareTo(total) < 0) {
            throw new BusinessException(String.format(
                    "Amount paid (%s) is less than the required total amount (%s)", tendered, total));
        }

        BigDecimal change = tendered.subtract(total).max(BigDecimal.ZERO);
        String ref = context.getReferenceNumber() != null ? context.getReferenceNumber() : "CASH-" + System.currentTimeMillis();

        return PaymentProcessResult.success(
                PaymentStatus.COMPLETED, tendered, change, ref, "Cash payment accepted successfully");
    }

    @Override
    public boolean supports(PaymentMethod onlineMethod) {
        return false; // Online cash handled via CashOnDeliveryPaymentStrategy
    }

    @Override
    public boolean supports(SalePaymentMethod saleMethod) {
        return saleMethod == SalePaymentMethod.CASH;
    }

    @Override
    public String getStrategyName() {
        return "CashPaymentStrategy";
    }
}
