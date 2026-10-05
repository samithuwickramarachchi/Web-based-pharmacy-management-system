package com.pharmacy.sales.service;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.common.service.ActivityLogService;
import com.pharmacy.common.service.FileStorageService;
import com.pharmacy.sales.dto.PaymentDto;
import com.pharmacy.sales.dto.PaymentReviewRequest;
import com.pharmacy.sales.entity.*;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import com.pharmacy.sales.repository.PaymentRepository;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OnlineOrderRepository orderRepository;
    private final FileStorageService fileStorageService;
    private final ActivityLogService activityLogService;
    private final UserRepository userRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          OnlineOrderRepository orderRepository,
                          FileStorageService fileStorageService,
                          ActivityLogService activityLogService,
                          UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.fileStorageService = fileStorageService;
        this.activityLogService = activityLogService;
        this.userRepository = userRepository;
    }

    public PaymentDto uploadPaymentSlip(Integer orderId, Integer currentUserId, boolean isStaff, MultipartFile file) {
        OnlineOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Online order not found with id " + orderId));

        if (!isStaff && (order.getCustomer() == null || order.getCustomer().getUser() == null ||
                !order.getCustomer().getUser().getId().equals(currentUserId))) {
            activityLogService.log(currentUserId, "UNAUTHORIZED_PAYMENT_SLIP_UPLOAD", "OnlineOrder", orderId,
                    "Unauthorized attempt to upload payment slip for order #" + order.getOrderNumber(), null);
            throw new AccessDeniedException("You do not have permission to upload payment slip for this order");
        }

        Payment payment = order.getPayment();
        if (payment == null) {
            throw new BusinessException("Order does not have an associated payment record");
        }

        if (payment.getPaymentMethod() != PaymentMethod.BANK_CARD_TRANSACTION) {
            throw new BusinessException("Payment slip upload is only allowed for Bank/Card Transaction orders");
        }

        // Store file safely using FileStorageService (validates size <= 5MB, format, MIME, magic bytes, path traversal)
        String storedPath = fileStorageService.storeFile(file, "slips");

        payment.setTransactionReference(storedPath);
        payment.setPaymentGateway("BANK_CARD_SLIP");
        payment.setStatus(PaymentStatus.PENDING);
        payment.setAttemptedAt(LocalDateTime.now());
        payment.setFailureReason(null);
        Payment saved = paymentRepository.save(payment);

        activityLogService.log(currentUserId, "PAYMENT_SLIP_UPLOADED", "OnlineOrder", orderId,
                "Uploaded bank transaction slip: " + file.getOriginalFilename(), null);

        return toDto(saved);
    }

    @Transactional(noRollbackFor = AccessDeniedException.class)
    public Resource getPaymentSlipResource(Integer orderId, Integer currentUserId, boolean isStaff) {
        OnlineOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Online order not found with id " + orderId));

        if (!isStaff && (order.getCustomer() == null || order.getCustomer().getUser() == null ||
                !order.getCustomer().getUser().getId().equals(currentUserId))) {
            activityLogService.log(currentUserId, "UNAUTHORIZED_PAYMENT_SLIP_ACCESS", "OnlineOrder", orderId,
                    "Unauthorized attempt to view payment slip for order #" + order.getOrderNumber(), null);
            throw new AccessDeniedException("You do not have permission to access this payment slip");
        }

        Payment payment = order.getPayment();
        if (payment == null || payment.getTransactionReference() == null || payment.getTransactionReference().isBlank()) {
            throw new ResourceNotFoundException("No payment slip has been uploaded for order id " + orderId);
        }

        return fileStorageService.loadFileAsResource(payment.getTransactionReference());
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentByOrderId(Integer orderId, Integer currentUserId, boolean isStaff) {
        OnlineOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Online order not found with id " + orderId));

        if (!isStaff && (order.getCustomer() == null || order.getCustomer().getUser() == null ||
                !order.getCustomer().getUser().getId().equals(currentUserId))) {
            throw new AccessDeniedException("You do not have permission to view payment details for this order");
        }

        Payment payment = order.getPayment();
        if (payment == null) {
            throw new ResourceNotFoundException("Payment record not found for order id " + orderId);
        }

        return toDto(payment);
    }

    public PaymentDto reviewPayment(Integer orderId, PaymentReviewRequest req, String reviewerUsername) {
        OnlineOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Online order not found with id " + orderId));

        Payment payment = order.getPayment();
        if (payment == null) {
            throw new BusinessException("Order does not have an associated payment record");
        }

        if (payment.getPaymentMethod() != PaymentMethod.BANK_CARD_TRANSACTION) {
            throw new BusinessException("Only Bank/Card Transaction payments require manual slip approval");
        }

        User reviewer = null;
        if (reviewerUsername != null && !reviewerUsername.isBlank()) {
            reviewer = userRepository.findByUsernameOrEmailWithRole(reviewerUsername).orElse(null);
        }

        if (req.getStatus() == PaymentStatus.COMPLETED) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setCompletedAt(LocalDateTime.now());
            payment.setFailureReason(null);

            // Update order status if appropriate
            if (Boolean.TRUE.equals(order.getRequiresPrescription())) {
                if (order.getPrescription() != null && order.getPrescription().getStatus() == PrescriptionStatus.APPROVED) {
                    order.setStatus(OrderStatus.CONFIRMED);
                } else {
                    order.setStatus(OrderStatus.AWAITING_PRESCRIPTION);
                }
            } else {
                order.setStatus(OrderStatus.CONFIRMED);
            }
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            activityLogService.log(reviewer, "PAYMENT_APPROVED", "OnlineOrder", orderId,
                    "Bank card payment approved for order #" + order.getOrderNumber(), null);
        } else if (req.getStatus() == PaymentStatus.FAILED) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason(req.getFailureReason() != null ? req.getFailureReason() : "Payment slip was rejected by staff");

            order.setStatus(OrderStatus.PAYMENT_FAILED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);

            activityLogService.log(reviewer, "PAYMENT_REJECTED", "OnlineOrder", orderId,
                    "Bank card payment rejected for order #" + order.getOrderNumber() + ". Reason: " + payment.getFailureReason(), null);
        } else {
            throw new BusinessException("Invalid review status. Must be COMPLETED or FAILED");
        }

        Payment saved = paymentRepository.save(payment);
        return toDto(saved);
    }

    public PaymentDto toDto(Payment p) {
        PaymentDto dto = new PaymentDto();
        dto.setId(p.getId());
        dto.setPaymentMethod(p.getPaymentMethod());
        dto.setAmount(p.getAmount());
        dto.setStatus(p.getStatus());
        dto.setTransactionReference(p.getTransactionReference());
        dto.setPaymentGateway(p.getPaymentGateway());
        dto.setAttemptedAt(p.getAttemptedAt());
        dto.setCompletedAt(p.getCompletedAt());
        return dto;
    }
}
