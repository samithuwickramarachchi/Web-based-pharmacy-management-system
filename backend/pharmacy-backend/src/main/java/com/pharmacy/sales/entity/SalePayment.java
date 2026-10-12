package com.pharmacy.sales.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sale_payments")
public class SalePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false, unique = true)
    private Sale sale;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private SalePaymentMethod paymentMethod;

    @Column(name = "amount_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "change_given", nullable = false, precision = 10, scale = 2)
    private BigDecimal changeGiven = BigDecimal.ZERO;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "paid_at", nullable = false)
    private LocalDateTime paidAt;

    @PrePersist
    protected void onCreate() {
        if (paidAt == null) {
            paidAt = LocalDateTime.now();
        }
        if (changeGiven == null) {
            changeGiven = BigDecimal.ZERO;
        }
    }

    public SalePayment() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Sale getSale() {
        return sale;
    }

    public void setSale(Sale sale) {
        this.sale = sale;
    }

    public SalePaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(SalePaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public BigDecimal getChangeGiven() {
        return changeGiven;
    }

    public void setChangeGiven(BigDecimal changeGiven) {
        this.changeGiven = changeGiven;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
}
