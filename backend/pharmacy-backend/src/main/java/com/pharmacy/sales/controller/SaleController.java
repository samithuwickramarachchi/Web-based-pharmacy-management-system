package com.pharmacy.sales.controller;

import com.pharmacy.sales.dto.SaleRequest;
import com.pharmacy.sales.dto.SaleResponse;
import com.pharmacy.sales.service.SaleService;
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
@RequestMapping("/api/sales")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<SaleResponse> createSale(@Valid @RequestBody SaleRequest req, Authentication auth) {
        String staffUsername = auth != null ? auth.getName() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(saleService.createSale(req, staffUsername));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<Page<SaleResponse>> getAllSales(Pageable pageable) {
        return ResponseEntity.ok(saleService.getAllSales(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<SaleResponse> getSaleById(@PathVariable Integer id) {
        return ResponseEntity.ok(saleService.getSaleById(id));
    }

    @GetMapping("/number/{saleNumber}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<SaleResponse> getSaleByNumber(@PathVariable String saleNumber) {
        return ResponseEntity.ok(saleService.getSaleByNumber(saleNumber));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SaleResponse>> getSalesByCustomer(@PathVariable Integer customerId) {
        return ResponseEntity.ok(saleService.getSalesByCustomer(customerId));
    }

    @GetMapping("/staff/{staffId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<List<SaleResponse>> getSalesByStaff(@PathVariable Integer staffId) {
        return ResponseEntity.ok(saleService.getSalesByStaff(staffId));
    }
}
