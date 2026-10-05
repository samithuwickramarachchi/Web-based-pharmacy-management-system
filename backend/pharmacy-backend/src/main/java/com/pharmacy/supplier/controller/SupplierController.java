package com.pharmacy.supplier.controller;

import com.pharmacy.supplier.dto.SupplierDto;
import com.pharmacy.supplier.dto.SupplierRequest;
import com.pharmacy.supplier.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF')")
    public ResponseEntity<Page<SupplierDto>> getAll(Pageable pageable) {
        return ResponseEntity.ok(supplierService.getAll(pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF')")
    public ResponseEntity<List<SupplierDto>> getActive() {
        return ResponseEntity.ok(supplierService.getActive());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_STAFF', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER', 'SUPPLIER_STAFF')")
    public ResponseEntity<SupplierDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(supplierService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER')")
    public ResponseEntity<SupplierDto> create(@Valid @RequestBody SupplierRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'SUPPLIER_OFFICER')")
    public ResponseEntity<SupplierDto> update(@PathVariable Integer id,
                                              @Valid @RequestBody SupplierRequest req) {
        return ResponseEntity.ok(supplierService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLIER_OFFICER')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
