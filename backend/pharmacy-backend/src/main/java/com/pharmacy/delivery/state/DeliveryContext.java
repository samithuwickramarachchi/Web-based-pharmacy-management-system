package com.pharmacy.delivery.state;

import com.pharmacy.delivery.entity.Delivery;
import com.pharmacy.delivery.entity.DeliveryStatus;
import com.pharmacy.delivery.entity.DeliveryStatusHistory;
import com.pharmacy.sales.entity.OnlineOrder;
import com.pharmacy.sales.entity.OrderStatus;

import java.time.LocalDateTime;

/**
 * Context class in the State Pattern that maintains the current state of a Delivery entity.
 */
public class DeliveryContext {

    private final Delivery delivery;
    private DeliveryState currentState;

    public DeliveryContext(Delivery delivery, DeliveryState initialState) {
        this.delivery = delivery;
        this.currentState = initialState;
    }

    public Delivery getDelivery() {
        return delivery;
    }

    public DeliveryState getCurrentState() {
        return currentState;
    }

    public void setState(DeliveryState newState) {
        this.currentState = newState;
        this.delivery.setStatus(newState.getStatus());
        this.delivery.setUpdatedAt(LocalDateTime.now());
    }

    public void addStatusHistory(DeliveryStatus newStatus, com.pharmacy.auth.entity.User changedBy, String notes) {
        DeliveryStatusHistory history = new DeliveryStatusHistory();
        history.setDelivery(delivery);
        history.setStatus(newStatus);
        history.setChangedBy(changedBy);
        history.setChangedAt(LocalDateTime.now());
        history.setNotes(notes);
        delivery.addStatusHistory(history);
    }

    public void syncOrderState(OrderStatus orderStatus) {
        OnlineOrder order = delivery.getOnlineOrder();
        if (order != null) {
            order.setStatus(orderStatus);
            order.setUpdatedAt(LocalDateTime.now());
        }
    }
}
