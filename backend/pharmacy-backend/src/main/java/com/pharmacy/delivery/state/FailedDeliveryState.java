package com.pharmacy.delivery.state;

import com.pharmacy.auth.entity.User;
import com.pharmacy.delivery.dto.DeliveryStatusUpdateRequest;
import com.pharmacy.delivery.entity.Delivery;
import com.pharmacy.delivery.entity.DeliveryStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Concrete State representing a failed delivery attempt (e.g. customer unavailable, incorrect address).
 * Allows rescheduling and re-assignment.
 */
@Component
public class FailedDeliveryState implements DeliveryState {

    @Override
    public DeliveryStatus getStatus() {
        return DeliveryStatus.FAILED;
    }

    @Override
    public void assignPersonnel(DeliveryContext context, User personnel, LocalDate scheduledDate,
                                String notes, User assigner) {
        Delivery d = context.getDelivery();
        d.setDeliveryPersonnel(personnel);
        if (scheduledDate != null) d.setScheduledDate(scheduledDate);
        // Reschedule to pending for new delivery attempt
        d.setStatus(DeliveryStatus.PENDING);
        context.addStatusHistory(DeliveryStatus.PENDING, assigner,
                "Rescheduled delivery assigned to " + personnel.getUsername() + ": " + (notes != null ? notes : ""));
    }

    @Override
    public void transitionStatus(DeliveryContext context, DeliveryStatusUpdateRequest request, User changedBy) {
        Delivery d = context.getDelivery();
        DeliveryStatus target = request.getStatus();

        if (request.getProofOfDelivery() != null) d.setProofOfDelivery(request.getProofOfDelivery());
        if (request.getFailureReason() != null) d.setFailureReason(request.getFailureReason());
        if (request.getDelayNotes() != null) d.setDelayNotes(request.getDelayNotes());

        d.setStatus(target);
        if (target == DeliveryStatus.DELIVERED) {
            d.setDeliveredAt(LocalDateTime.now());
        }
        context.addStatusHistory(target, changedBy, request.getNotes() != null ? request.getNotes() : "Status updated from FAILED to " + target);
    }
}
