package com.pharmacy.sales.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PaymentMethodConverter implements AttributeConverter<PaymentMethod, String> {

    @Override
    public String convertToDatabaseColumn(PaymentMethod attribute) {
        if (attribute == null) {
            return null;
        }
        switch (attribute) {
            case CASH_ON_DELIVERY:
                return "CASH_ON_DELIVERY";
            case BANK_CARD_TRANSACTION:
                return "ONLINE_GATEWAY";
            default:
                return attribute.name();
        }
    }

    @Override
    public PaymentMethod convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        if ("ONLINE_GATEWAY".equalsIgnoreCase(dbData) || "BANK_CARD_TRANSACTION".equalsIgnoreCase(dbData)) {
            return PaymentMethod.BANK_CARD_TRANSACTION;
        }
        if ("CASH_ON_DELIVERY".equalsIgnoreCase(dbData)) {
            return PaymentMethod.CASH_ON_DELIVERY;
        }
        return PaymentMethod.valueOf(dbData);
    }
}
