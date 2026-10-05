package com.pharmacy.sales.strategy.payment;

import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.PaymentStatus;
import com.pharmacy.sales.entity.SalePaymentMethod;

import java.math.BigDecimal;

/**
 * Result object returned after a payment strategy processes a transaction.
 */
public class PaymentProcessResult {

    private final boolean successful;
    private final PaymentStatus paymentStatus;
    private final BigDecimal amountPaid;
    private final BigDecimal changeGiven;
    private final String transactionReference;
    private final String message;

    public PaymentProcessResult(boolean successful, PaymentStatus paymentStatus,
                                BigDecimal amountPaid, BigDecimal changeGiven,
                                String transactionReference, String message) {
        this.successful = successful;
        this.paymentStatus = paymentStatus;
        this.amountPaid = amountPaid;
        this.changeGiven = changeGiven;
        this.transactionReference = transactionReference;
        this.message = message;
    }

    public static PaymentProcessResult success(PaymentStatus status, BigDecimal amountPaid,
                                              BigDecimal changeGiven, String ref, String msg) {
        return new PaymentProcessResult(true, status, amountPaid, changeGiven, ref, msg);
    }

    public static PaymentProcessResult failure(String errorMsg) {
        return new PaymentProcessResult(false, PaymentStatus.FAILED, BigDecimal.ZERO, BigDecimal.ZERO, null, errorMsg);
    }

    public boolean isSuccessful() {
        return successful;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public BigDecimal getChangeGiven() {
        return changeGiven;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public String getMessage() {
        return message;
    }
}
