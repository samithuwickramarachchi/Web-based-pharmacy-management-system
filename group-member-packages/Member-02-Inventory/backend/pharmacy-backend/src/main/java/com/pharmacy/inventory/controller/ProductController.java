package com.pharmacy.inventory.controller;

import com.pharmacy.inventory.dto.*;
import com.pharmacy.inventory.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<ProductDto>> getAll(Pageable pageable) {
        return ResponseEntity.ok(productService.getAll(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProductDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/category/{categoryId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProductDto>> getByCategory(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(productService.getByCategory(categoryId));
    }

    /**
     * Returns all active products whose available stock (active + non-expired batches) is
     * at or below their configured minimum reorder level.
     * Used by the Admin and Inventory Manager dashboards.
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY_MANAGER','INVENTORY_STAFF','PHARMACIST')")
    public ResponseEntity<List<ProductDto>> getLowStockProducts() {
        return ResponseEntity.ok(productService.getLowStockProducts());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY_MANAGER')")
    public ResponseEntity<ProductDto> create(@Valid @RequestBody ProductRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY_MANAGER')")
    public ResponseEntity<ProductDto> update(@PathVariable Integer id,
                                             @Valid @RequestBody ProductRequest req) {
        return ResponseEntity.ok(productService.update(id, req));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY_MANAGER')")
    public ResponseEntity<Void> deactivate(@PathVariable Integer id) {
        productService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Batch sub-resource ──────────────────────────────────────────────────────

    @GetMapping("/{id}/batches")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProductBatchDto>> getBatches(@PathVariable Integer id) {
        return ResponseEntity.ok(productService.getBatches(id));
    }

    @PostMapping("/{id}/batches")
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY_MANAGER')")
    public ResponseEntity<ProductBatchDto> createBatch(@PathVariable Integer id,
                                                       @Valid @RequestBody ProductBatchRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createBatch(id, req));
    }

    @PutMapping("/{id}/batches/{batchId}")
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY_MANAGER')")
    public ResponseEntity<ProductBatchDto> updateBatch(@PathVariable Integer id,
                                                       @PathVariable Integer batchId,
                                                       @Valid @RequestBody ProductBatchRequest req) {
        return ResponseEntity.ok(productService.updateBatch(id, batchId, req));
    }

    @PostMapping("/{id}/batches/{batchId}/adjust")
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY_MANAGER')")
    public ResponseEntity<ProductBatchDto> adjustStock(@PathVariable Integer id,
                                                       @PathVariable Integer batchId,
                                                       @Valid @RequestBody StockAdjustmentRequest req) {
        return ResponseEntity.ok(productService.adjustStock(id, batchId, req));
    }
}
