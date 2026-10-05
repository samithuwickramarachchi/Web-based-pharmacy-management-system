package com.pharmacy.delivery.state;

import com.pharmacy.auth.entity.User;
import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.delivery.dto.DeliveryStatusUpdateRequest;
import com.pharmacy.delivery.entity.DeliveryStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Concrete State representing a completed, delivered parcel.
 * Terminal state that prevents invalid backwards transitions.
 */
@Component
public class DeliveredDeliveryState implements DeliveryState {

    @Override
    public DeliveryStatus getStatus() {
        return DeliveryStatus.DELIVERED;
    }

    @Override
    public void assignPersonnel(DeliveryContext context, User personnel, LocalDate scheduledDate,
                                String notes, User assigner) {
        throw new BusinessException("Cannot reassign delivery personnel because the order has already been DELIVERED.");
    }

    @Override
    public void transitionStatus(DeliveryContext context, DeliveryStatusUpdateRequest request, User changedBy) {
        if (request.getStatus() == DeliveryStatus.DELIVERED) {
            // Allow updating confirmation notes or proof of delivery
            if (request.getProofOfDelivery() != null) {
                context.getDelivery().setProofOfDelivery(request.getProofOfDelivery());
            }
            if (request.getNotes() != null) {
                context.addStatusHistory(DeliveryStatus.DELIVERED, changedBy, request.getNotes());
            }
        } else {
            throw new BusinessException("Order is already marked as DELIVERED. Reverting status is not permitted.");
        }
    }
}
