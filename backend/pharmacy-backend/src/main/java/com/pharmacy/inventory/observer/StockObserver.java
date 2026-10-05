package com.pharmacy.inventory.observer;

/**
 * Observer interface for reacting to stock changes (Behavioral Pattern).
 */
public interface StockObserver {

    void onStockChanged(StockEvent event);

    String getObserverName();
}
