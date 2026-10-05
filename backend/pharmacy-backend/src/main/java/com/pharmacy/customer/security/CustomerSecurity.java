package com.pharmacy.customer.security;

import com.pharmacy.auth.security.CustomUserDetails;
import com.pharmacy.common.service.ActivityLogService;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

@Component("customerSecurity")
public class CustomerSecurity {

    private final CustomerRepository customerRepository;
    private final ActivityLogService activityLogService;

    public CustomerSecurity(CustomerRepository customerRepository, ActivityLogService activityLogService) {
        this.customerRepository = customerRepository;
        this.activityLogService = activityLogService;
    }

    public boolean isOwner(Authentication authentication, Integer customerId) {
        if (authentication == null || !authentication.isAuthenticated() || customerId == null) {
            return false;
        }

        // Allow Admins and Customer Managers full access
        boolean isStaff = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN") || a.equals("ROLE_CUSTOMER_MANAGER"));
        if (isStaff) {
            return true;
        }

        // For CUSTOMER role, verify ownership
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            Integer userId = userDetails.getId();
            Optional<Customer> customerOpt = customerRepository.findByUserId(userId);
            if (customerOpt.isPresent() && customerId.equals(customerOpt.get().getId())) {
                return true;
            }

            // Unauthorized access attempt: log audit trail
            String ipAddress = null;
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                ipAddress = request.getRemoteAddr();
            }

            String details = String.format(
                    "{\"error\":\"Ownership mismatch\",\"attemptedCustomerId\":%d,\"userId\":%d,\"userEmail\":\"%s\"}",
                    customerId, userId, userDetails.getEmail()
            );

            activityLogService.log(
                    userId,
                    "UNAUTHORIZED_CUSTOMER_ACCESS_ATTEMPT",
                    "customer",
                    customerId,
                    details,
                    ipAddress
            );
        }

        return false;
    }
}
