package com.pharmacy.sales.strategy.payment;

import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.SalePaymentMethod;

import java.math.BigDecimal;

/**
 * Parameter Context carrying transaction data for the Payment Strategy Pattern.
 */
public class PaymentProcessingContext {

    private final BigDecimal totalAmount;
    private final BigDecimal amountTendered;
    private final String referenceNumber;
    private final PaymentMethod onlinePaymentMethod;
    private final SalePaymentMethod salePaymentMethod;
    private final String customerIdentifier;

    public PaymentProcessingContext(BigDecimal totalAmount, BigDecimal amountTendered,
                                  String referenceNumber, PaymentMethod onlinePaymentMethod,
                                  SalePaymentMethod salePaymentMethod, String customerIdentifier) {
        this.totalAmount = totalAmount;
        this.amountTendered = amountTendered;
        this.referenceNumber = referenceNumber;
        this.onlinePaymentMethod = onlinePaymentMethod;
        this.salePaymentMethod = salePaymentMethod;
        this.customerIdentifier = customerIdentifier;
    }

    public static PaymentProcessingContext forSale(BigDecimal totalAmount, BigDecimal amountPaid,
                                                   SalePaymentMethod method, String ref, String customerId) {
        return new PaymentProcessingContext(totalAmount, amountPaid, ref, null, method, customerId);
    }

    public static PaymentProcessingContext forOnlineOrder(BigDecimal totalAmount, PaymentMethod method,
                                                         String ref, String customerId) {
        return new PaymentProcessingContext(totalAmount, totalAmount, ref, method, null, customerId);
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public BigDecimal getAmountTendered() {
        return amountTendered;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public PaymentMethod getOnlinePaymentMethod() {
        return onlinePaymentMethod;
    }

    public SalePaymentMethod getSalePaymentMethod() {
        return salePaymentMethod;
    }

    public String getCustomerIdentifier() {
        return customerIdentifier;
    }
}
