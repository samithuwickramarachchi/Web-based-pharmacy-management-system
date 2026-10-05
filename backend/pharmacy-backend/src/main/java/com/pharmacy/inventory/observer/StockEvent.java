package com.pharmacy.inventory.observer;

import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import com.pharmacy.inventory.entity.StockMovementType;

import java.time.LocalDateTime;

/**
 * Event object carrying details of stock changes in the Observer Pattern.
 */
public class StockEvent {

    private final Product product;
    private final ProductBatch batch;
    private final int previousQuantity;
    private final int newQuantity;
    private final int totalProductStock;
    private final StockMovementType movementType;
    private final String reason;
    private final LocalDateTime timestamp;

    public StockEvent(Product product, ProductBatch batch, int previousQuantity, int newQuantity,
                      int totalProductStock, StockMovementType movementType, String reason) {
        this.product = product;
        this.batch = batch;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;
        this.totalProductStock = totalProductStock;
        this.movementType = movementType;
        this.reason = reason;
        this.timestamp = LocalDateTime.now();
    }

    public Product getProduct() {
        return product;
    }

    public ProductBatch getBatch() {
        return batch;
    }

    public int getPreviousQuantity() {
        return previousQuantity;
    }

    public int getNewQuantity() {
        return newQuantity;
    }

    public int getTotalProductStock() {
        return totalProductStock;
    }

    public StockMovementType getMovementType() {
        return movementType;
    }

    public String getReason() {
        return reason;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
