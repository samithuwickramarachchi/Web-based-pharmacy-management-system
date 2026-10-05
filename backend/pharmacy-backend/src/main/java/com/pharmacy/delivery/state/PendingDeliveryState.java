package com.pharmacy.delivery.state;

import com.pharmacy.auth.entity.User;
import com.pharmacy.delivery.dto.DeliveryStatusUpdateRequest;
import com.pharmacy.delivery.entity.Delivery;
import com.pharmacy.delivery.entity.DeliveryStatus;
import com.pharmacy.sales.entity.OrderStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Concrete State representing a delivery awaiting assignment or dispatch.
 */
@Component
public class PendingDeliveryState implements DeliveryState {

    @Override
    public DeliveryStatus getStatus() {
        return DeliveryStatus.PENDING;
    }

    @Override
    public void assignPersonnel(DeliveryContext context, User personnel, LocalDate scheduledDate,
                                String notes, User assigner) {
        Delivery d = context.getDelivery();
        d.setDeliveryPersonnel(personnel);
        if (scheduledDate != null) {
            d.setScheduledDate(scheduledDate);
        }
        String noteText = notes != null ? notes : "Assigned to personnel: " + personnel.getUsername();
        context.addStatusHistory(DeliveryStatus.PENDING, assigner, noteText);
    }

    @Override
    public void transitionStatus(DeliveryContext context, DeliveryStatusUpdateRequest request, User changedBy) {
        Delivery d = context.getDelivery();
        DeliveryStatus target = request.getStatus();

        if (request.getProofOfDelivery() != null) d.setProofOfDelivery(request.getProofOfDelivery());
        if (request.getFailureReason() != null) d.setFailureReason(request.getFailureReason());
        if (request.getDelayNotes() != null) d.setDelayNotes(request.getDelayNotes());

        if (target == DeliveryStatus.OUT_FOR_DELIVERY) {
            d.setStatus(DeliveryStatus.OUT_FOR_DELIVERY);
            context.addStatusHistory(DeliveryStatus.OUT_FOR_DELIVERY, changedBy, request.getNotes() != null ? request.getNotes() : "Dispatched out for delivery");
            context.syncOrderState(OrderStatus.OUT_FOR_DELIVERY);
        } else if (target == DeliveryStatus.DELIVERED) {
            d.setStatus(DeliveryStatus.DELIVERED);
            d.setDeliveredAt(LocalDateTime.now());
            context.addStatusHistory(DeliveryStatus.DELIVERED, changedBy, request.getNotes() != null ? request.getNotes() : "Direct delivery completed");
            context.syncOrderState(OrderStatus.DELIVERED);
        } else if (target == DeliveryStatus.FAILED) {
            d.setStatus(DeliveryStatus.FAILED);
            context.addStatusHistory(DeliveryStatus.FAILED, changedBy, request.getNotes() != null ? request.getNotes() : "Delivery cancelled or address unserviceable");
        } else {
            // Keep pending or update notes
            context.addStatusHistory(DeliveryStatus.PENDING, changedBy, request.getNotes());
        }
    }
}
