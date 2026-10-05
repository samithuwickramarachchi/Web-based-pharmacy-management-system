package com.pharmacy.sales.strategy.payment;

import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.PaymentStatus;
import com.pharmacy.sales.entity.SalePaymentMethod;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Concrete strategy for online bank/card direct transfer transactions requiring deposit slip verification.
 */
@Component
public class BankTransferPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentProcessResult processPayment(PaymentProcessingContext context) {
        BigDecimal total = context.getTotalAmount();
        String ref = context.getReferenceNumber() != null ? context.getReferenceNumber() : "BANK-REF-" + System.currentTimeMillis();

        return PaymentProcessResult.success(
                PaymentStatus.PENDING, total, BigDecimal.ZERO, ref,
                "Bank transfer recorded. Awaiting verification of transaction slip.");
    }

    @Override
    public boolean supports(PaymentMethod onlineMethod) {
        return onlineMethod == PaymentMethod.BANK_CARD_TRANSACTION;
    }

    @Override
    public boolean supports(SalePaymentMethod saleMethod) {
        return false;
    }

    @Override
    public String getStrategyName() {
        return "BankTransferPaymentStrategy";
    }
}
