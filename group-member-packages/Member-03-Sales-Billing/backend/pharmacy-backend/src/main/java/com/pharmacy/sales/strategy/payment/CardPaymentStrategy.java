package com.pharmacy.sales.strategy.payment;

import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.PaymentStatus;
import com.pharmacy.sales.entity.SalePaymentMethod;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Concrete strategy for card payments (POS card swipe/terminal or debit card).
 */
@Component
public class CardPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentProcessResult processPayment(PaymentProcessingContext context) {
        BigDecimal total = context.getTotalAmount();
        BigDecimal amountPaid = context.getAmountTendered() != null ? context.getAmountTendered() : total;
        String ref = context.getReferenceNumber();
        if (ref == null || ref.isBlank()) {
            ref = "CARD-AUTH-" + System.currentTimeMillis();
        }

        return PaymentProcessResult.success(
                PaymentStatus.COMPLETED, amountPaid, BigDecimal.ZERO, ref, "Card payment authorized successfully");
    }

    @Override
    public boolean supports(PaymentMethod onlineMethod) {
        return false;
    }

    @Override
    public boolean supports(SalePaymentMethod saleMethod) {
        return saleMethod == SalePaymentMethod.CARD;
    }

    @Override
    public String getStrategyName() {
        return "CardPaymentStrategy";
    }
}
