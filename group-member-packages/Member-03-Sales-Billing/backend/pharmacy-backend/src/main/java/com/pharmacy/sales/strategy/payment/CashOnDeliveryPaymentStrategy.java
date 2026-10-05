package com.pharmacy.sales.strategy.payment;

import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.PaymentStatus;
import com.pharmacy.sales.entity.SalePaymentMethod;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Concrete strategy for Cash On Delivery (COD) payment processing.
 */
@Component
public class CashOnDeliveryPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentProcessResult processPayment(PaymentProcessingContext context) {
        BigDecimal total = context.getTotalAmount();
        String ref = "COD-" + System.currentTimeMillis();

        return PaymentProcessResult.success(
                PaymentStatus.PENDING, total, BigDecimal.ZERO, ref,
                "Cash on Delivery scheduled. Payment will be collected upon parcel delivery.");
    }

    @Override
    public boolean supports(PaymentMethod onlineMethod) {
        return onlineMethod == PaymentMethod.CASH_ON_DELIVERY;
    }

    @Override
    public boolean supports(SalePaymentMethod saleMethod) {
        return false;
    }

    @Override
    public String getStrategyName() {
        return "CashOnDeliveryPaymentStrategy";
    }
}
