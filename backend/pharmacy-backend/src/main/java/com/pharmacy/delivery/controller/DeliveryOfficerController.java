package com.pharmacy.delivery.controller;

import com.pharmacy.delivery.dto.DeliveryOfficerDto;
import com.pharmacy.delivery.dto.DeliveryOfficerRequest;
import com.pharmacy.delivery.service.DeliveryOfficerService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-officers")
public class DeliveryOfficerController {

    private final DeliveryOfficerService officerService;

    public DeliveryOfficerController(DeliveryOfficerService officerService) {
        this.officerService = officerService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<Page<DeliveryOfficerDto>> getAll(Pageable pageable) {
        return ResponseEntity.ok(officerService.getAll(pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<List<DeliveryOfficerDto>> getActive() {
        return ResponseEntity.ok(officerService.getActive());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<DeliveryOfficerDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(officerService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_OFFICER')")
    public ResponseEntity<DeliveryOfficerDto> create(@Valid @RequestBody DeliveryOfficerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(officerService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_OFFICER')")
    public ResponseEntity<DeliveryOfficerDto> update(@PathVariable Integer id,
                                                     @Valid @RequestBody DeliveryOfficerRequest req) {
        return ResponseEntity.ok(officerService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DELIVERY_OFFICER')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        officerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
