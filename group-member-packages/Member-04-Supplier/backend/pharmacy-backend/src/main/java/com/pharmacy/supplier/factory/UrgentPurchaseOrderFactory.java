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
 * Concrete Creator for urgent, expedited procurement orders (e.g. out-of-stock critical medicine).
 */
@Component
@Order(1)
public class UrgentPurchaseOrderFactory implements PurchaseOrderFactory {

    public static final String TYPE_NAME = "URGENT";

    @Override
    public boolean supports(PurchaseOrderRequest request) {
        if (request == null) {
            return false;
        }
        String notes = request.getNotes() != null ? request.getNotes().toLowerCase() : "";
        if (notes.contains("urgent") || notes.contains("emergency") || notes.contains("rush") || notes.contains("stat")) {
            return true;
        }
        if (request.getOrderDate() != null && request.getExpectedDeliveryDate() != null) {
            // Needed within 2 days
            return request.getExpectedDeliveryDate().isBefore(request.getOrderDate().plusDays(3));
        }
        return false;
    }

    @Override
    public PurchaseOrder createPurchaseOrder(PurchaseOrderRequest request, Supplier supplier, User orderedBy) {
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber("PO-URG-" + System.currentTimeMillis());
        po.setSupplier(supplier);
        po.setOrderedBy(orderedBy);
        po.setStatus(PurchaseOrderStatus.SUBMITTED);
        po.setOrderDate(request.getOrderDate() != null ? request.getOrderDate() : LocalDate.now());

        if (request.getExpectedDeliveryDate() != null) {
            po.setExpectedDeliveryDate(request.getExpectedDeliveryDate());
        } else {
            // Urgent priority: 1 day turnaround
            po.setExpectedDeliveryDate(po.getOrderDate().plusDays(1));
        }

        String prefix = "[EXPEDITED / URGENT PROCUREMENT] ";
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
