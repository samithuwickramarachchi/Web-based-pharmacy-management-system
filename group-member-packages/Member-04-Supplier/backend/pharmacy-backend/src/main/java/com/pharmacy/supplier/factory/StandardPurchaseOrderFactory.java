package com.pharmacy.supplier.factory;

import com.pharmacy.auth.entity.User;
import com.pharmacy.supplier.dto.PurchaseOrderRequest;
import com.pharmacy.supplier.entity.PurchaseOrder;
import com.pharmacy.supplier.entity.PurchaseOrderStatus;
import com.pharmacy.supplier.entity.Supplier;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Concrete Creator for regular, standard routine procurement orders.
 */
@Component
@Order(3)
public class StandardPurchaseOrderFactory implements PurchaseOrderFactory {

    public static final String TYPE_NAME = "STANDARD";

    @Override
    public boolean supports(PurchaseOrderRequest request) {
        // Fallback default factory
        return true;
    }

    @Override
    public PurchaseOrder createPurchaseOrder(PurchaseOrderRequest request, Supplier supplier, User orderedBy) {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-STD-" + System.currentTimeMillis());
        po.setSupplier(supplier);
        po.setOrderedBy(orderedBy);
        po.setStatus(PurchaseOrderStatus.SUBMITTED);
        po.setOrderDate(request.getOrderDate() != null ? request.getOrderDate() : LocalDate.now());

        if (request.getExpectedDeliveryDate() != null) {
            po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        } else {
            // Default 7 days standard lead time
            po.setExpectedDeliveryDate(po.getOrderDate().plusDays(7));
        }

        String notes = request.getNotes() != null ? request.getNotes().trim() : "";
        po.setNotes(notes.isEmpty() ? "[STANDARD PROCUREMENT]" : notes);
        return po;
    }

    @Override
    public String getOrderType() {
        return TYPE_NAME;
    }
}
