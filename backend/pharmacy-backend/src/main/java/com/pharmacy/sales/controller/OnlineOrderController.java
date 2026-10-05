package com.pharmacy.sales.controller;

import com.pharmacy.auth.security.CustomUserDetails;
import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.service.ActivityLogService;
import com.pharmacy.common.service.FileStorageService;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.sales.dto.OnlineOrderCreateRequest;
import com.pharmacy.sales.dto.OnlineOrderResponse;
import com.pharmacy.sales.dto.OnlineOrderStatusUpdateRequest;
import com.pharmacy.sales.entity.OrderStatus;
import com.pharmacy.sales.service.OnlineOrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OnlineOrderController {

    private final OnlineOrderService orderService;
    private final CustomerRepository customerRepository;
    private final FileStorageService fileStorageService;
    private final ActivityLogService activityLogService;

    public OnlineOrderController(OnlineOrderService orderService,
                                 CustomerRepository customerRepository,
                                 FileStorageService fileStorageService,
                                 ActivityLogService activityLogService) {
        this.orderService = orderService;
        this.customerRepository = customerRepository;
        this.fileStorageService = fileStorageService;
        this.activityLogService = activityLogService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OnlineOrderResponse> createOrder(@Valid @RequestBody OnlineOrderCreateRequest req,
                                                           @AuthenticationPrincipal CustomUserDetails userDetails,
                                                           HttpServletRequest request) {
        Integer targetCustomerId = req.getCustomerId();
        if (userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Customer cust = customerRepository.findByUserId(userDetails.getId()).orElse(null);
            if (cust != null) {
                if (targetCustomerId != null && !targetCustomerId.equals(cust.getId())) {
                    activityLogService.log(
                            userDetails.getId(),
                            "UNAUTHORIZED_ORDER_ACCESS",
                            "Customer",
                            targetCustomerId,
                            String.format("{\"error\":\"Customer attempted to place order for customer %d\",\"userId\":%d}", targetCustomerId, userDetails.getId()),
                            request != null ? request.getRemoteAddr() : null
                    );
                    throw new AccessDeniedException("Cannot place order for another customer");
                }
                targetCustomerId = cust.getId();
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(req, targetCustomerId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OnlineOrderResponse> createOrderWithPrescription(
            @RequestPart("order") @Valid OnlineOrderCreateRequest req,
            @RequestPart(value = "prescriptionFile", required = false) MultipartFile prescriptionFile,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest request) {

        Integer targetCustomerId = req.getCustomerId();
        if (userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Customer cust = customerRepository.findByUserId(userDetails.getId()).orElse(null);
            if (cust != null) {
                if (targetCustomerId != null && !targetCustomerId.equals(cust.getId())) {
                    activityLogService.log(
                            userDetails.getId(),
                            "UNAUTHORIZED_ORDER_ACCESS",
                            "Customer",
                            targetCustomerId,
                            String.format("{\"error\":\"Customer attempted to place prescription order for customer %d\",\"userId\":%d}", targetCustomerId, userDetails.getId()),
                            request != null ? request.getRemoteAddr() : null
                    );
                    throw new AccessDeniedException("Cannot place order for another customer");
                }
                targetCustomerId = cust.getId();
            }
        }

        if (prescriptionFile != null && !prescriptionFile.isEmpty()) {
            String storedPath = fileStorageService.storeFile(prescriptionFile, "prescriptions");
            req.setPrescriptionFilePath(storedPath);
            req.setPrescriptionOriginalFilename(prescriptionFile.getOriginalFilename());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(req, targetCustomerId));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<Page<OnlineOrderResponse>> getAllOrders(Pageable pageable) {
        return ResponseEntity.ok(orderService.getAllOrders(pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OnlineOrderResponse> getOrderById(@PathVariable Integer id,
                                                            @AuthenticationPrincipal CustomUserDetails userDetails,
                                                            HttpServletRequest request) {
        OnlineOrderResponse order = orderService.getOrderById(id);
        if (userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Customer cust = customerRepository.findByUserId(userDetails.getId()).orElse(null);
            if (cust != null && !cust.getId().equals(order.getCustomerId())) {
                activityLogService.log(
                        userDetails.getId(),
                        "UNAUTHORIZED_ORDER_ACCESS",
                        "OnlineOrder",
                        id,
                        String.format("{\"error\":\"Customer isolation violation\",\"attemptedOrderId\":%d,\"orderCustomerId\":%d,\"userId\":%d}", id, order.getCustomerId(), userDetails.getId()),
                        request != null ? request.getRemoteAddr() : null
                );
                throw new AccessDeniedException("You do not have permission to view another customer's order");
            }
        }
        return ResponseEntity.ok(order);
    }

    @GetMapping("/number/{orderNumber}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OnlineOrderResponse> getOrderByNumber(@PathVariable String orderNumber,
                                                                @AuthenticationPrincipal CustomUserDetails userDetails,
                                                                HttpServletRequest request) {
        OnlineOrderResponse order = orderService.getOrderByNumber(orderNumber);
        if (userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Customer cust = customerRepository.findByUserId(userDetails.getId()).orElse(null);
            if (cust != null && !cust.getId().equals(order.getCustomerId())) {
                activityLogService.log(
                        userDetails.getId(),
                        "UNAUTHORIZED_ORDER_ACCESS",
                        "OnlineOrder",
                        order.getId(),
                        String.format("{\"error\":\"Customer isolation violation\",\"attemptedOrderNumber\":\"%s\",\"orderCustomerId\":%d,\"userId\":%d}", orderNumber, order.getCustomerId(), userDetails.getId()),
                        request != null ? request.getRemoteAddr() : null
                );
                throw new AccessDeniedException("You do not have permission to view another customer's order");
            }
        }
        return ResponseEntity.ok(order);
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<OnlineOrderResponse>> getOrdersByCustomer(
            @PathVariable Integer customerId,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest request) {

        if (userDetails != null && userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER"))) {
            Customer cust = customerRepository.findByUserId(userDetails.getId()).orElse(null);
            if (cust != null && !cust.getId().equals(customerId)) {
                activityLogService.log(
                        userDetails.getId(),
                        "UNAUTHORIZED_ORDER_ACCESS",
                        "Customer",
                        customerId,
                        String.format("{\"error\":\"Customer isolation violation\",\"attemptedCustomerId\":%d,\"userId\":%d}", customerId, userDetails.getId()),
                        request != null ? request.getRemoteAddr() : null
                );
                throw new AccessDeniedException("You do not have permission to view another customer's orders");
            }
        }

        LocalDateTime start = parseDate(startDate, false);
        LocalDateTime end = parseDate(endDate, true);

        if (start != null && end != null && start.isAfter(end)) {
            throw new BusinessException("Start date cannot be after end date");
        }

        return ResponseEntity.ok(orderService.getOrdersByCustomer(customerId, start, end));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<List<OnlineOrderResponse>> getOrdersByStatus(@PathVariable OrderStatus status) {
        return ResponseEntity.ok(orderService.getOrdersByStatus(status));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER', 'DELIVERY_STAFF', 'DELIVERY_OFFICER')")
    public ResponseEntity<OnlineOrderResponse> updateOrderStatus(@PathVariable Integer id,
                                                                 @Valid @RequestBody OnlineOrderStatusUpdateRequest req) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, req.getStatus()));
    }

    @PostMapping("/{id}/award-loyalty")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES_STAFF', 'SALES_OFFICER')")
    public ResponseEntity<OnlineOrderResponse> awardLoyalty(@PathVariable Integer id) {
        orderService.awardLoyaltyPoints(id);
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    private LocalDateTime parseDate(String dateStr, boolean isEndOfDay) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        String s = dateStr.trim();
        try {
            if (s.contains("T")) {
                return LocalDateTime.parse(s);
            } else {
                LocalDate date = LocalDate.parse(s);
                return isEndOfDay ? date.atTime(LocalTime.MAX) : date.atStartOfDay();
            }
        } catch (DateTimeParseException e) {
            throw new BusinessException("Invalid date format: '" + dateStr + "'. Expected format: yyyy-MM-dd or yyyy-MM-dd'T'HH:mm:ss");
        }
    }
}
