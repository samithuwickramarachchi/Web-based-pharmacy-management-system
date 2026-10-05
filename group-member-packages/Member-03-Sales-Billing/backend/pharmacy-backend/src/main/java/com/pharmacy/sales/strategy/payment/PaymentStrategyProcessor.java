package com.pharmacy.sales.strategy.payment;

import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.SalePaymentMethod;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Context in the Strategy Pattern for payment processing.
 * Dispatches transactions to the appropriate concrete PaymentStrategy.
 */
@Component
public class PaymentStrategyProcessor {

    private static final Logger log = LoggerFactory.getLogger(PaymentStrategyProcessor.class);

    private final List<PaymentStrategy> strategies;

    public PaymentStrategyProcessor(List<PaymentStrategy> strategies) {
        this.strategies = strategies;
        log.info("Initialized PaymentStrategyProcessor with {} strategies", strategies.size());
    }

    /**
     * Executes payment processing for POS / in-store sales transactions.
     */
    public PaymentProcessResult processSalePayment(PaymentProcessingContext context) {
        SalePaymentMethod method = context.getSalePaymentMethod();
        PaymentStrategy strategy = strategies.stream()
                .filter(s -> s.supports(method))
                .findFirst()
                .orElseThrow(() -> new BusinessException("No payment strategy found for sale payment method: " + method));

        log.info("Dispatching POS sale payment to {}", strategy.getStrategyName());
        return strategy.processPayment(context);
    }

    /**
     * Executes payment processing for online orders.
     */
    public PaymentProcessResult processOnlineOrderPayment(PaymentProcessingContext context) {
        PaymentMethod method = context.getOnlinePaymentMethod();
        PaymentStrategy strategy = strategies.stream()
                .filter(s -> s.supports(method))
                .findFirst()
                .orElseThrow(() -> new BusinessException("No payment strategy found for online payment method: " + method));

        log.info("Dispatching online order payment to {}", strategy.getStrategyName());
        return strategy.processPayment(context);
    }
}
