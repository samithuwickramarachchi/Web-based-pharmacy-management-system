package com.pharmacy.customer.controller;

import com.pharmacy.auth.security.CustomUserDetails;
import com.pharmacy.customer.dto.*;
import com.pharmacy.customer.service.CustomerService;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // GET /api/customers?page=0&size=20
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER')")
    public ResponseEntity<Page<CustomerDto>> getAll(Pageable pageable) {
        return ResponseEntity.ok(customerService.getAll(pageable));
    }

    // GET /api/customers/search?query=...&name=...&phone=...&membershipId=...
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER','SALES_OFFICER','SALES_STAFF')")
    public ResponseEntity<List<CustomerDto>> searchCustomers(
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "membershipId", required = false) String membershipId) {
        return ResponseEntity.ok(customerService.searchCustomers(query, name, phone, membershipId));
    }

    // GET /api/customers/me
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER','ADMIN','CUSTOMER_MANAGER')")
    public ResponseEntity<CustomerDto> getCurrentCustomer(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(customerService.getByUserId(userDetails.getId()));
    }

    // GET /api/customers/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER') or (hasRole('CUSTOMER') and @customerSecurity.isOwner(authentication, #id))")
    public ResponseEntity<CustomerDto> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(customerService.getById(id));
    }

    // PATCH /api/customers/{id}
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER') or (hasRole('CUSTOMER') and @customerSecurity.isOwner(authentication, #id))")
    public ResponseEntity<CustomerDto> updateProfile(@PathVariable Integer id,
                                                     @Valid @RequestBody CustomerUpdateRequest req) {
        return ResponseEntity.ok(customerService.updateProfile(id, req));
    }

    // DELETE /api/customers/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER')")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest request) {
        customerService.deleteCustomer(id, userDetails != null ? userDetails.getId() : null, request != null ? request.getRemoteAddr() : null);
        return ResponseEntity.noContent().build();
    }

    // PATCH /api/customers/{id}/change-password
    @PatchMapping("/{id}/change-password")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('CUSTOMER') and @customerSecurity.isOwner(authentication, #id))")
    public ResponseEntity<Void> changePassword(@PathVariable Integer id,
                                               @Valid @RequestBody ChangePasswordRequest req) {
        customerService.changePassword(id, req);
        return ResponseEntity.noContent().build();
    }

    // GET /api/customers/{id}/addresses
    @GetMapping("/{id}/addresses")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER') or (hasRole('CUSTOMER') and @customerSecurity.isOwner(authentication, #id))")
    public ResponseEntity<List<AddressResponse>> getAddresses(@PathVariable Integer id) {
        return ResponseEntity.ok(customerService.getAddresses(id));
    }

    // POST /api/customers/{id}/addresses
    @PostMapping("/{id}/addresses")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER') or (hasRole('CUSTOMER') and @customerSecurity.isOwner(authentication, #id))")
    public ResponseEntity<AddressResponse> addAddress(@PathVariable Integer id,
                                                      @Valid @RequestBody AddressRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.addAddress(id, req));
    }

    // PUT /api/customers/{id}/addresses/{addressId}
    @PutMapping("/{id}/addresses/{addressId}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER') or (hasRole('CUSTOMER') and @customerSecurity.isOwner(authentication, #id))")
    public ResponseEntity<AddressResponse> updateAddress(@PathVariable Integer id,
                                                         @PathVariable Integer addressId,
                                                         @Valid @RequestBody AddressRequest req) {
        return ResponseEntity.ok(customerService.updateAddress(id, addressId, req));
    }

    // DELETE /api/customers/{id}/addresses/{addressId}
    @DeleteMapping("/{id}/addresses/{addressId}")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER') or (hasRole('CUSTOMER') and @customerSecurity.isOwner(authentication, #id))")
    public ResponseEntity<Void> deleteAddress(@PathVariable Integer id,
                                              @PathVariable Integer addressId) {
        customerService.deleteAddress(id, addressId);
        return ResponseEntity.noContent().build();
    }

    // PATCH /api/customers/{id}/addresses/{addressId}/default
    @PatchMapping("/{id}/addresses/{addressId}/default")
    @PreAuthorize("hasAnyRole('ADMIN','CUSTOMER_MANAGER') or (hasRole('CUSTOMER') and @customerSecurity.isOwner(authentication, #id))")
    public ResponseEntity<AddressResponse> setDefault(@PathVariable Integer id,
                                                      @PathVariable Integer addressId) {
        return ResponseEntity.ok(customerService.setDefaultAddress(id, addressId));
    }
}
