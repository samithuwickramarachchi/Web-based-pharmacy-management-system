package com.pharmacy.inventory.controller;

import com.pharmacy.inventory.dto.ManufacturerDto;
import com.pharmacy.inventory.dto.ManufacturerRequest;
import com.pharmacy.inventory.service.ManufacturerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory/manufacturers")
public class ManufacturerController {

    private final ManufacturerService manufacturerService;

    public ManufacturerController(ManufacturerService manufacturerService) {
        this.manufacturerService = manufacturerService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ManufacturerDto>> getAll() {
        return ResponseEntity.ok(manufacturerService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ManufacturerDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(manufacturerService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY_MANAGER')")
    public ResponseEntity<ManufacturerDto> create(@Valid @RequestBody ManufacturerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(manufacturerService.create(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','INVENTORY_MANAGER')")
    public ResponseEntity<ManufacturerDto> update(@PathVariable Integer id,
                                                  @Valid @RequestBody ManufacturerRequest req) {
        return ResponseEntity.ok(manufacturerService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        manufacturerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
