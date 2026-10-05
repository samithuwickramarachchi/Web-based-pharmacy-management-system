package com.pharmacy.supplier.factory;

import com.pharmacy.auth.entity.User;
import com.pharmacy.supplier.dto.PurchaseOrderRequest;
import com.pharmacy.supplier.entity.PurchaseOrder;
import com.pharmacy.supplier.entity.Supplier;

/**
 * Factory Method Pattern: Abstract Creator for manufacturing Purchase Order instances
 * tailored to different operational procurement workflows (Standard, Urgent/Expedited, Bulk).
 */
public interface PurchaseOrderFactory {

    /**
     * Determines whether this factory handles the specified purchase order request.
     */
    boolean supports(PurchaseOrderRequest request);

    /**
     * Factory Method to instantiate and initialize a {@link PurchaseOrder} entity.
     *
     * @param request   the client PO request payload
     * @param supplier  the resolved supplier
     * @param orderedBy the authenticated staff user initiating the purchase order
     * @return a configured {@link PurchaseOrder} entity ready for item processing
     */
    PurchaseOrder createPurchaseOrder(PurchaseOrderRequest request, Supplier supplier, User orderedBy);

    /**
     * Identifying name of the order type (e.g. "STANDARD", "URGENT", "BULK").
     */
    String getOrderType();
}
