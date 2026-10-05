package com.pharmacy.sales.controller;

import com.pharmacy.auth.security.CustomUserDetails;
import com.pharmacy.common.service.FileStorageService;
import com.pharmacy.sales.dto.PrescriptionResponse;
import com.pharmacy.sales.dto.PrescriptionStatusUpdateRequest;
import com.pharmacy.sales.entity.PrescriptionStatus;
import com.pharmacy.sales.service.PrescriptionService;
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

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final FileStorageService fileStorageService;

    public PrescriptionController(PrescriptionService prescriptionService, FileStorageService fileStorageService) {
        this.prescriptionService = prescriptionService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<List<PrescriptionResponse>> getAll() {
        return ResponseEntity.ok(prescriptionService.getAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PrescriptionResponse> getById(@PathVariable Integer id,
                                                        @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer currentUserId = userDetails != null ? userDetails.getId() : null;
        boolean isStaff = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SALES_STAFF") ||
                               a.getAuthority().equals("ROLE_SALES_OFFICER"));

        return ResponseEntity.ok(prescriptionService.getById(id, currentUserId, isStaff));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PrescriptionResponse> getByOrderId(@PathVariable Integer orderId,
                                                             @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer currentUserId = userDetails != null ? userDetails.getId() : null;
        boolean isStaff = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SALES_STAFF") ||
                               a.getAuthority().equals("ROLE_SALES_OFFICER"));

        return ResponseEntity.ok(prescriptionService.getByOrderId(orderId, currentUserId, isStaff));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PrescriptionResponse>> getByCustomer(@PathVariable Integer customerId,
                                                                    @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer currentUserId = userDetails != null ? userDetails.getId() : null;
        boolean isStaff = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SALES_STAFF") ||
                               a.getAuthority().equals("ROLE_SALES_OFFICER"));

        return ResponseEntity.ok(prescriptionService.getByCustomer(customerId, currentUserId, isStaff));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<List<PrescriptionResponse>> getByStatus(@PathVariable PrescriptionStatus status) {
        return ResponseEntity.ok(prescriptionService.getByStatus(status));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PrescriptionResponse> uploadPrescriptionFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "orderId", required = false) Integer orderId,
            @RequestParam(value = "customerId", required = false) Integer customerId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Integer currentUserId = userDetails != null ? userDetails.getId() : null;
        boolean isStaff = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SALES_STAFF") ||
                               a.getAuthority().equals("ROLE_SALES_OFFICER"));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(prescriptionService.uploadPrescriptionFile(orderId, customerId, currentUserId, isStaff, file));
    }

    @GetMapping("/{id}/file")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> getPrescriptionFile(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Integer currentUserId = userDetails != null ? userDetails.getId() : null;
        boolean isStaff = userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") ||
                               a.getAuthority().equals("ROLE_SALES_STAFF") ||
                               a.getAuthority().equals("ROLE_SALES_OFFICER"));

        Resource resource = prescriptionService.getPrescriptionResource(id, currentUserId, isStaff);
        MediaType mediaType = fileStorageService.determineMediaType(resource.getFilename());

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<PrescriptionResponse> reviewPrescription(@PathVariable Integer id,
                                                                   @Valid @RequestBody PrescriptionStatusUpdateRequest req,
                                                                   Authentication auth) {
        String reviewerUsername = auth != null ? auth.getName() : null;
        return ResponseEntity.ok(prescriptionService.reviewPrescription(id, req, reviewerUsername));
    }
}
