package com.pharmacy.delivery.state;

import com.pharmacy.auth.entity.User;
import com.pharmacy.delivery.dto.DeliveryStatusUpdateRequest;
import com.pharmacy.delivery.entity.DeliveryStatus;

import java.time.LocalDate;

/**
 * State interface in the State Pattern for Delivery Lifecycle management (Behavioral Pattern).
 */
public interface DeliveryState {

    DeliveryStatus getStatus();

    void assignPersonnel(DeliveryContext context, User personnel, LocalDate scheduledDate, String notes, User assigner);

    void transitionStatus(DeliveryContext context, DeliveryStatusUpdateRequest request, User changedBy);
}
