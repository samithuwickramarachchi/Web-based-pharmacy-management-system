package com.pharmacy.inventory.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Subject (Observable) in the Observer Pattern managing inventory stock change subscribers.
 */
@Component
public class StockSubject {

    private static final Logger log = LoggerFactory.getLogger(StockSubject.class);

    private final List<StockObserver> observers = new CopyOnWriteArrayList<>();

    public StockSubject(List<StockObserver> registeredObservers) {
        if (registeredObservers != null) {
            observers.addAll(registeredObservers);
            log.info("Initialized StockSubject with {} observers", observers.size());
        }
    }

    public void registerObserver(StockObserver observer) {
        if (observer != null && !observers.contains(observer)) {
            observers.add(observer);
            log.debug("Registered observer: {}", observer.getObserverName());
        }
    }

    public void removeObserver(StockObserver observer) {
        if (observer != null) {
            observers.remove(observer);
            log.debug("Removed observer: {}", observer.getObserverName());
        }
    }

    public void notifyObservers(StockEvent event) {
        for (StockObserver observer : observers) {
            try {
                observer.onStockChanged(event);
            } catch (Exception e) {
                log.error("Error notifying observer {}: {}", observer.getObserverName(), e.getMessage());
            }
        }
    }

    public List<StockObserver> getObservers() {
        return List.copyOf(observers);
    }
}
