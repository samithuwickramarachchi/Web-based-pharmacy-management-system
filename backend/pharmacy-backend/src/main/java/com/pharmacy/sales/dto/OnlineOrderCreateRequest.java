package com.pharmacy.sales.dto;

import com.pharmacy.sales.entity.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class OnlineOrderCreateRequest {

    private Integer customerId;

    // Validated dynamically in OnlineOrderService based on fulfillmentType:
    // DELIVERY requires deliveryAddress, STORE_PICKUP does not require deliveryAddress
    private String deliveryAddress;

    private Integer promotionId;

    private String notes;

    private String fulfillmentType; // DELIVERY | STORE_PICKUP

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    // Optional: if null/empty, order is checked out from customer's shopping cart
    private List<CartItemRequest> items;

    // Optional prescription details if any item requires a prescription
    private String prescriptionFilePath;
    private String prescriptionOriginalFilename;

    public OnlineOrderCreateRequest() {}

    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public Integer getPromotionId() { return promotionId; }
    public void setPromotionId(Integer promotionId) { this.promotionId = promotionId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getFulfillmentType() { return fulfillmentType; }
    public void setFulfillmentType(String fulfillmentType) { this.fulfillmentType = fulfillmentType; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public List<CartItemRequest> getItems() { return items; }
    public void setItems(List<CartItemRequest> items) { this.items = items; }

    public String getPrescriptionFilePath() { return prescriptionFilePath; }
    public void setPrescriptionFilePath(String prescriptionFilePath) { this.prescriptionFilePath = prescriptionFilePath; }

    public String getPrescriptionOriginalFilename() { return prescriptionOriginalFilename; }
    public void setPrescriptionOriginalFilename(String prescriptionOriginalFilename) { this.prescriptionOriginalFilename = prescriptionOriginalFilename; }
}
