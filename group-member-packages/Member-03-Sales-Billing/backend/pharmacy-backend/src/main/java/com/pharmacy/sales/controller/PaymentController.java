package com.pharmacy.sales.controller;

import com.pharmacy.auth.security.CustomUserDetails;
import com.pharmacy.common.service.FileStorageService;
import com.pharmacy.sales.dto.PaymentDto;
import com.pharmacy.sales.dto.PaymentReviewRequest;
import com.pharmacy.sales.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class PaymentController {

    private final PaymentService paymentService;
    private final FileStorageService fileStorageService;

    public PaymentController(PaymentService paymentService, FileStorageService fileStorageService) {
        this.paymentService = paymentService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(value = {"/api/orders/{orderId}/payment-slip", "/api/payments/orders/{orderId}/slip"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentDto> uploadPaymentSlip(
            @PathVariable Integer orderId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Integer currentUserId = userDetails != null ? userDetails.getId() : null;
        boolean isStaff = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SALES_STAFF") ||
                               a.getAuthority().equals("ROLE_SALES_OFFICER"));

        PaymentDto result = paymentService.uploadPaymentSlip(orderId, currentUserId, isStaff, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping({"/api/orders/{orderId}/payment-slip", "/api/payments/orders/{orderId}/slip"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> getPaymentSlip(
            @PathVariable Integer orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Integer currentUserId = userDetails != null ? userDetails.getId() : null;
        boolean isStaff = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SALES_STAFF") ||
                               a.getAuthority().equals("ROLE_SALES_OFFICER"));

        Resource resource = paymentService.getPaymentSlipResource(orderId, currentUserId, isStaff);
        MediaType mediaType = fileStorageService.determineMediaType(resource.getFilename());

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping({"/api/orders/{orderId}/payment", "/api/payments/orders/{orderId}"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PaymentDto> getPayment(
            @PathVariable Integer orderId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Integer currentUserId = userDetails != null ? userDetails.getId() : null;
        boolean isStaff = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SALES_STAFF") ||
                               a.getAuthority().equals("ROLE_SALES_OFFICER"));

        return ResponseEntity.ok(paymentService.getPaymentByOrderId(orderId, currentUserId, isStaff));
    }

    @PatchMapping({"/api/orders/{orderId}/payment/review", "/api/payments/orders/{orderId}/review"})
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<PaymentDto> reviewPayment(
            @PathVariable Integer orderId,
            @Valid @RequestBody PaymentReviewRequest req,
            Authentication auth) {

        String reviewerUsername = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(paymentService.reviewPayment(orderId, req, reviewerUsername));
    }
}
