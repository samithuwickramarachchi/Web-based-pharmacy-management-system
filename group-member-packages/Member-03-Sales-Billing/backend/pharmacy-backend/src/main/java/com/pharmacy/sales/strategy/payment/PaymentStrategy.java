package com.pharmacy.sales.strategy.payment;

import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.SalePaymentMethod;

/**
 * Strategy interface defining payment execution algorithm (Behavioral Pattern).
 */
public interface PaymentStrategy {

    PaymentProcessResult processPayment(PaymentProcessingContext context);

    boolean supports(PaymentMethod onlineMethod);

    boolean supports(SalePaymentMethod saleMethod);

    String getStrategyName();
}
