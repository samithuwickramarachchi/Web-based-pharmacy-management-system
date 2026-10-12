package com.pharmacy.delivery.state;

import com.pharmacy.auth.entity.User;
import com.pharmacy.delivery.dto.DeliveryStatusUpdateRequest;
import com.pharmacy.delivery.entity.Delivery;
import com.pharmacy.delivery.entity.DeliveryOfficer;
import com.pharmacy.delivery.entity.DeliveryStatus;
import com.pharmacy.sales.entity.OrderStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Concrete State representing a delivery actively on route with assigned delivery officer.
 */
@Component
public class OutForDeliveryState implements DeliveryState {

    @Override
    public DeliveryStatus getStatus() {
        return DeliveryStatus.OUT_FOR_DELIVERY;
    }

    @Override
    public void assignOfficer(DeliveryContext context, DeliveryOfficer officer, LocalDate scheduledDate,
                                String notes, User assigner) {
        Delivery d = context.getDelivery();
        d.setDeliveryOfficer(officer);
        if (scheduledDate != null) d.setScheduledDate(scheduledDate);
        context.addStatusHistory(DeliveryStatus.OUT_FOR_DELIVERY, assigner,
                "Reassigned to delivery officer " + officer.getFullName() + " while out for delivery" + (notes != null && !notes.isBlank() ? ": " + notes : ""));
    }

    @Override
    public void transitionStatus(DeliveryContext context, DeliveryStatusUpdateRequest request, User changedBy) {
        Delivery d = context.getDelivery();
        DeliveryStatus target = request.getStatus();

        if (request.getProofOfDelivery() != null) d.setProofOfDelivery(request.getProofOfDelivery());
        if (request.getFailureReason() != null) d.setFailureReason(request.getFailureReason());
        if (request.getDelayNotes() != null) d.setDelayNotes(request.getDelayNotes());

        if (target == DeliveryStatus.DELIVERED) {
            d.setStatus(DeliveryStatus.DELIVERED);
            d.setDeliveredAt(LocalDateTime.now());
            context.addStatusHistory(DeliveryStatus.DELIVERED, changedBy, request.getNotes() != null ? request.getNotes() : "Parcel successfully handed over to customer");
            context.syncOrderState(OrderStatus.DELIVERED);
        } else if (target == DeliveryStatus.FAILED) {
            d.setStatus(DeliveryStatus.FAILED);
            context.addStatusHistory(DeliveryStatus.FAILED, changedBy, request.getNotes() != null ? request.getNotes() : "Delivery attempt failed");
        } else {
            d.setStatus(target);
            context.addStatusHistory(target, changedBy, request.getNotes());
        }
    }
}
