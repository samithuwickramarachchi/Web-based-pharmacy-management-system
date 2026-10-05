package com.pharmacy.delivery.controller;

import com.pharmacy.delivery.dto.DeliveryAssignRequest;
import com.pharmacy.delivery.dto.DeliveryDto;
import com.pharmacy.delivery.dto.DeliveryStatusUpdateRequest;
import com.pharmacy.delivery.entity.DeliveryStatus;
import com.pharmacy.delivery.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<Page<DeliveryDto>> getAll(Pageable pageable) {
        return ResponseEntity.ok(deliveryService.getAll(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DeliveryDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(deliveryService.getById(id));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DeliveryDto> getByOrderId(@PathVariable Integer orderId) {
        return ResponseEntity.ok(deliveryService.getByOrderId(orderId));
    }

    @GetMapping("/personnel/{personnelId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<List<DeliveryDto>> getByPersonnel(@PathVariable Integer personnelId) {
        return ResponseEntity.ok(deliveryService.getByPersonnel(personnelId));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<List<DeliveryDto>> getByStatus(@PathVariable DeliveryStatus status) {
        return ResponseEntity.ok(deliveryService.getByStatus(status));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_OFFICER')")
    public ResponseEntity<DeliveryDto> assignPersonnel(@PathVariable Integer id,
                                                       @Valid @RequestBody DeliveryAssignRequest req,
                                                       Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(deliveryService.assignPersonnel(id, req, username));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<DeliveryDto> updateStatus(@PathVariable Integer id,
                                                    @Valid @RequestBody DeliveryStatusUpdateRequest req,
                                                    Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(deliveryService.updateStatus(id, req, username));
    }
}
