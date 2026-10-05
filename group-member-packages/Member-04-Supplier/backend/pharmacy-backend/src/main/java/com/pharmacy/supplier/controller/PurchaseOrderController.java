package com.pharmacy.supplier.controller;

import com.pharmacy.supplier.dto.PurchaseOrderDto;
import com.pharmacy.supplier.dto.PurchaseOrderRequest;
import com.pharmacy.supplier.dto.ReceiveStockRequest;
import com.pharmacy.supplier.entity.PurchaseOrderStatus;
import com.pharmacy.supplier.service.PurchaseOrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    public PurchaseOrderController(PurchaseOrderService poService) {
        this.poService = poService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF')")
    public ResponseEntity<Page<PurchaseOrderDto>> getAll(Pageable pageable) {
        return ResponseEntity.ok(poService.getAll(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF')")
    public ResponseEntity<PurchaseOrderDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(poService.getById(id));
    }

    @GetMapping("/number/{poNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF')")
    public ResponseEntity<PurchaseOrderDto> getByPoNumber(@PathVariable String poNumber) {
        return ResponseEntity.ok(poService.getByPoNumber(poNumber));
    }

    @GetMapping("/supplier/{supplierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF')")
    public ResponseEntity<List<PurchaseOrderDto>> getBySupplier(@PathVariable Integer supplierId) {
        return ResponseEntity.ok(poService.getBySupplier(supplierId));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF')")
    public ResponseEntity<List<PurchaseOrderDto>> getByStatus(@PathVariable PurchaseOrderStatus status) {
        return ResponseEntity.ok(poService.getByStatus(status));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER')")
    public ResponseEntity<PurchaseOrderDto> create(@Valid @RequestBody PurchaseOrderRequest req, Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(poService.create(req, username));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER')")
    public ResponseEntity<PurchaseOrderDto> updateStatus(@PathVariable Integer id,
                                                         @RequestParam PurchaseOrderStatus status) {
        return ResponseEntity.ok(poService.updateStatus(id, status));
    }

    @PostMapping("/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF')")
    public ResponseEntity<PurchaseOrderDto> receiveStock(@PathVariable Integer id,
                                                         @Valid @RequestBody ReceiveStockRequest req,
                                                         Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(poService.receiveStock(id, req, username));
    }
}
