package com.pharmacy.customer.controller;

import com.pharmacy.auth.security.CustomUserDetails;
import com.pharmacy.customer.dto.SupportMessageRequest;
import com.pharmacy.customer.dto.SupportMessageResponse;
import com.pharmacy.customer.dto.SupportReplyRequest;
import com.pharmacy.customer.service.SupportMessageService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/support-messages", "/api/support"})
public class SupportMessageController {

    private final SupportMessageService supportMessageService;

    public SupportMessageController(SupportMessageService supportMessageService) {
        this.supportMessageService = supportMessageService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<SupportMessageResponse> createMessage(
            @Valid @RequestBody SupportMessageRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        SupportMessageResponse response = supportMessageService.createMessage(req, userDetails.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_MANAGER', 'SALES_OFFICER', 'SALES_STAFF')")
    public ResponseEntity<Page<SupportMessageResponse>> getAllMessages(Pageable pageable) {
        return ResponseEntity.ok(supportMessageService.getAllMessages(pageable));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<SupportMessageResponse>> getMyMessages(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(supportMessageService.getMessagesByUserId(userDetails.getId()));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_MANAGER', 'SALES_OFFICER', 'SALES_STAFF')")
    public ResponseEntity<List<SupportMessageResponse>> getMessagesByCustomer(@PathVariable Integer customerId) {
        return ResponseEntity.ok(supportMessageService.getMessagesByCustomer(customerId));
    }

    /**
     * Staff reply endpoint — Admin, Customer Manager, or Sales Officer can reply to
     * a customer's support message.  The staff member's username is stored as the
     * repliedByName so the customer can see who responded.
     */
    @PostMapping("/{id}/reply")
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER_MANAGER', 'SALES_OFFICER', 'SALES_STAFF')")
    public ResponseEntity<SupportMessageResponse> replyToMessage(
            @PathVariable Integer id,
            @Valid @RequestBody SupportReplyRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String staffName = userDetails.getUsername();
        SupportMessageResponse response = supportMessageService.replyToMessage(id, req, staffName);
        return ResponseEntity.ok(response);
    }
}
