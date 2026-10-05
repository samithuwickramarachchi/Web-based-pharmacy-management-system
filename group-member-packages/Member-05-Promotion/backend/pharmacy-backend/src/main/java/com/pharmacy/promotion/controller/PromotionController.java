package com.pharmacy.promotion.controller;

import com.pharmacy.promotion.dto.CouponValidateRequest;
import com.pharmacy.promotion.dto.CouponValidateResponse;
import com.pharmacy.promotion.dto.PromotionDto;
import com.pharmacy.promotion.dto.PromotionRequest;
import com.pharmacy.promotion.service.PromotionService;
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
@RequestMapping("/api/promotions")
public class PromotionController {

    private final PromotionService promotionService;

    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<PromotionDto>> getAll(Pageable pageable) {
        return ResponseEntity.ok(promotionService.getAll(pageable));
    }

    @GetMapping("/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PromotionDto>> getActive() {
        return ResponseEntity.ok(promotionService.getActive());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PromotionDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(promotionService.getById(id));
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PromotionDto> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(promotionService.getByCode(code));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROMOTION_MANAGER')")
    public ResponseEntity<PromotionDto> create(@Valid @RequestBody PromotionRequest req, Authentication auth) {
        String username = auth != null ? auth.getName() : null;
        return ResponseEntity.status(HttpStatus.CREATED).body(promotionService.create(req, username));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROMOTION_MANAGER')")
    public ResponseEntity<PromotionDto> update(@PathVariable Integer id,
                                               @Valid @RequestBody PromotionRequest req) {
        return ResponseEntity.ok(promotionService.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROMOTION_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        promotionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/validate-coupon")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CouponValidateResponse> validateCoupon(@Valid @RequestBody CouponValidateRequest req) {
        return ResponseEntity.ok(promotionService.validateCoupon(req));
    }
}
