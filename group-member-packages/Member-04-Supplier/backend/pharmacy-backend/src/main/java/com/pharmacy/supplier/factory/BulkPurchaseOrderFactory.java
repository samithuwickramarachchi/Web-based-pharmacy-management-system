package com.pharmacy.supplier.factory;

import com.pharmacy.auth.entity.User;
import com.pharmacy.supplier.dto.PurchaseOrderItemRequest;
import com.pharmacy.supplier.dto.PurchaseOrderRequest;
import com.pharmacy.supplier.entity.PurchaseOrder;
import com.pharmacy.supplier.entity.PurchaseOrderStatus;
import com.pharmacy.supplier.entity.Supplier;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Concrete Creator for bulk replenishment purchase orders.
 */
@Component
@Order(2)
public class BulkPurchaseOrderFactory implements PurchaseOrderFactory {

    public static final String TYPE_NAME = "BULK";

    @Override
    public boolean supports(PurchaseOrderRequest request) {
        if (request == null) {
            return false;
        }
        String notes = request.getNotes() != null ? request.getNotes().toLowerCase() : "";
        if (notes.contains("bulk") || notes.contains("wholesale") || notes.contains("container")) {
            return true;
        }
        // Check if total quantity across items >= 500 units
        if (request.getItems() != null) {
            int totalQty = request.getItems().stream()
                    .filter(i -> i.getQuantityOrdered() != null)
                    .mapToInt(PurchaseOrderItemRequest::getQuantityOrdered)
                    .sum();
            return totalQty >= 500;
        }
        return false;
    }

    @Override
    public PurchaseOrder createPurchaseOrder(PurchaseOrderRequest request, Supplier supplier, User orderedBy) {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-BLK-" + System.currentTimeMillis());
        po.setSupplier(supplier);
        po.setOrderedBy(orderedBy);
        po.setStatus(PurchaseOrderStatus.SUBMITTED);
        po.setOrderDate(request.getOrderDate() != null ? request.getOrderDate() : LocalDate.now());

        if (request.getExpectedDeliveryDate() != null) {
            po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        } else {
            // Bulk shipments: 14 days lead time
            po.setExpectedDeliveryDate(po.getOrderDate().plusDays(14));
        }

        String prefix = "[BULK REPLENISHMENT] ";
        String existingNotes = request.getNotes() != null ? request.getNotes().trim() : "";
        if (existingNotes.startsWith(prefix)) {
            po.setNotes(existingNotes);
        } else {
            po.setNotes(prefix + existingNotes);
        }

        return po;
    }

    @Override
    public String getOrderType() {
        return TYPE_NAME;
    }
}
