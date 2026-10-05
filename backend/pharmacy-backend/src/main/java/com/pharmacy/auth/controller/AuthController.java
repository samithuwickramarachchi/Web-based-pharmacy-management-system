package com.pharmacy.auth.controller;

import com.pharmacy.auth.dto.AuthResponse;
import com.pharmacy.auth.dto.CustomerRegisterRequest;
import com.pharmacy.auth.dto.LoginRequest;
import com.pharmacy.auth.dto.UserProfileResponse;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.auth.security.CustomUserDetails;
import com.pharmacy.auth.security.JwtTokenProvider;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.service.CustomerService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final CustomerService customerService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          UserRepository userRepository,
                          CustomerService customerService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
        this.customerService = customerService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerCustomer(@Valid @RequestBody CustomerRegisterRequest registerRequest,
                                                         HttpServletRequest request) {
        Customer customer = customerService.registerCustomer(registerRequest, request.getRemoteAddr());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerRequest.getEmail().trim().toLowerCase(),
                        registerRequest.getPassword()
                )
        );

        String jwt = tokenProvider.generateToken(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        List<String> authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        AuthResponse authResponse = new AuthResponse(
                jwt,
                tokenProvider.getExpirationMs(),
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getRoleName(),
                authorities
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()
                )
        );

        String jwt = tokenProvider.generateToken(authentication);
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        // Update last login timestamp
        userRepository.findById(userDetails.getId()).ifPresent(user -> {
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);
        });

        List<String> authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        AuthResponse authResponse = new AuthResponse(
                jwt,
                tokenProvider.getExpirationMs(),
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getRoleName(),
                authorities
        );

        return ResponseEntity.ok(authResponse);
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        List<String> authorities = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        UserProfileResponse profile = new UserProfileResponse(
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                userDetails.getRoleName(),
                authorities
        );

        return ResponseEntity.ok(profile);
    }

    // ─── Role Verification Test Endpoints ─────────────────────────────────────

    @GetMapping("/test/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testAdminAccess() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Access granted: ADMIN role verified.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test/sales")
    @PreAuthorize("hasAnyRole('SALES_STAFF', 'SALES_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> testSalesAccess() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Access granted: SALES_STAFF role verified.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test/inventory")
    @PreAuthorize("hasAnyRole('INVENTORY_STAFF', 'INVENTORY_MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> testInventoryAccess() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Access granted: INVENTORY_STAFF role verified.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test/delivery")
    @PreAuthorize("hasAnyRole('DELIVERY_STAFF', 'DELIVERY_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, String>> testDeliveryAccess() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Access granted: DELIVERY_STAFF role verified.");
        return ResponseEntity.ok(response);
    }
}
