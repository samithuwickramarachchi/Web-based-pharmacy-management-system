package com.pharmacy.sales.service;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.common.service.ActivityLogService;
import com.pharmacy.common.service.FileStorageService;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.sales.dto.PrescriptionResponse;
import com.pharmacy.sales.dto.PrescriptionStatusUpdateRequest;
import com.pharmacy.sales.entity.*;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import com.pharmacy.sales.repository.PrescriptionRepository;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final OnlineOrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final ActivityLogService activityLogService;

    public PrescriptionService(PrescriptionRepository prescriptionRepository,
                               OnlineOrderRepository orderRepository,
                               CustomerRepository customerRepository,
                               UserRepository userRepository,
                               FileStorageService fileStorageService,
                               ActivityLogService activityLogService) {
        this.prescriptionRepository = prescriptionRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.activityLogService = activityLogService;
    }

    public PrescriptionResponse uploadPrescriptionFile(Integer orderId, Integer customerId, Integer currentUserId, boolean isStaff, MultipartFile file) {
        // Validates file size (<= 5MB), extension (.pdf, .jpg, .jpeg, .png), MIME type, magic bytes, and path traversal
        String storedPath = fileStorageService.storeFile(file, "prescriptions");

        if (orderId != null) {
            OnlineOrder order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Online order not found with id " + orderId));

            if (!isStaff && (order.getCustomer() == null || order.getCustomer().getUser() == null ||
                    !order.getCustomer().getUser().getId().equals(currentUserId))) {
                activityLogService.log(currentUserId, "UNAUTHORIZED_PRESCRIPTION_UPLOAD", "OnlineOrder", orderId,
                        "Unauthorized attempt to upload prescription for order #" + order.getOrderNumber(), null);
                throw new AccessDeniedException("You do not have permission to upload prescription for this order");
            }

            Customer customer = order.getCustomer();
            if (customer == null && customerId != null) {
                customer = customerRepository.findById(customerId).orElse(null);
            }

            Prescription prescription = prescriptionRepository.findByOnlineOrderId(orderId)
                    .orElseGet(() -> {
                        Prescription p = new Prescription();
                        p.setOnlineOrder(order);
                        return p;
                    });

            prescription.setCustomer(customer);
            prescription.setFilePath(storedPath);
            prescription.setOriginalFilename(file.getOriginalFilename());
            prescription.setStatus(PrescriptionStatus.PENDING);
            prescription.setUploadedAt(LocalDateTime.now());
            prescription.setReviewedBy(null);
            prescription.setReviewedAt(null);
            prescription.setReviewNotes(null);

            order.setPrescription(prescription);
            if (order.getStatus() == OrderStatus.PENDING_PAYMENT && Boolean.TRUE.equals(order.getRequiresPrescription())) {
                order.setStatus(OrderStatus.AWAITING_PRESCRIPTION);
            }

            Prescription saved = prescriptionRepository.save(prescription);
            orderRepository.save(order);

            activityLogService.log(currentUserId, "PRESCRIPTION_UPLOADED", "OnlineOrder", orderId,
                    "Prescription file uploaded for order #" + order.getOrderNumber(), null);

            return toDto(saved);
        } else {
            // Standalone prescription upload (prior to checkout)
            Customer customer = null;
            if (currentUserId != null) {
                customer = customerRepository.findByUserId(currentUserId).orElse(null);
            }
            if (customer == null && customerId != null) {
                customer = customerRepository.findById(customerId).orElse(null);
            }
            if (!isStaff && customerId != null && customer != null && !customer.getId().equals(customerId)) {
                throw new AccessDeniedException("Cannot upload prescription for another customer");
            }

            PrescriptionResponse dto = new PrescriptionResponse();
            dto.setFilePath(storedPath);
            dto.setOriginalFilename(file.getOriginalFilename());
            dto.setStatus(PrescriptionStatus.PENDING);
            dto.setUploadedAt(LocalDateTime.now());
            if (customer != null) {
                dto.setCustomerId(customer.getId());
                dto.setCustomerName(customer.getFirstName() + " " + customer.getLastName());
            }

            activityLogService.log(currentUserId, "STANDALONE_PRESCRIPTION_UPLOADED", "Prescription", null,
                    "Uploaded standalone prescription: " + file.getOriginalFilename(), null);

            return dto;
        }
    }

    public PrescriptionResponse uploadPrescription(Integer orderId, Integer customerId, String filePath, String originalFilename) {
        OnlineOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Online order not found with id " + orderId));

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + customerId));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new BusinessException("Order does not belong to the specified customer");
        }

        Prescription prescription = prescriptionRepository.findByOnlineOrderId(orderId)
                .orElseGet(() -> {
                    Prescription p = new Prescription();
                    p.setOnlineOrder(order);
                    p.setCustomer(customer);
                    return p;
                });

        prescription.setFilePath(filePath);
        prescription.setOriginalFilename(originalFilename);
        prescription.setStatus(PrescriptionStatus.PENDING);
        prescription.setUploadedAt(LocalDateTime.now());
        prescription.setReviewedBy(null);
        prescription.setReviewedAt(null);
        prescription.setReviewNotes(null);

        order.setPrescription(prescription);
        Prescription saved = prescriptionRepository.save(prescription);
        return toDto(saved);
    }

    @Transactional(noRollbackFor = AccessDeniedException.class)
    public Resource getPrescriptionResource(Integer id, Integer currentUserId, boolean isStaff) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id " + id));

        if (!isStaff && (p.getCustomer() == null || p.getCustomer().getUser() == null ||
                !p.getCustomer().getUser().getId().equals(currentUserId))) {
            activityLogService.log(currentUserId, "UNAUTHORIZED_PRESCRIPTION_FILE_ACCESS", "Prescription", id,
                    "Attempted unauthorized access to prescription file", null);
            throw new AccessDeniedException("You do not have permission to access this prescription file");
        }

        return fileStorageService.loadFileAsResource(p.getFilePath());
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getById(Integer id) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id " + id));
        return toDto(p);
    }

    @Transactional(noRollbackFor = AccessDeniedException.class)
    public PrescriptionResponse getById(Integer id, Integer currentUserId, boolean isStaff) {
        Prescription p = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id " + id));

        if (!isStaff && (p.getCustomer() == null || p.getCustomer().getUser() == null ||
                !p.getCustomer().getUser().getId().equals(currentUserId))) {
            activityLogService.log(currentUserId, "UNAUTHORIZED_PRESCRIPTION_ACCESS", "Prescription", id,
                    "Attempted unauthorized access to prescription details", null);
            throw new AccessDeniedException("You do not have permission to view this prescription");
        }

        return toDto(p);
    }

    @Transactional(readOnly = true)
    public PrescriptionResponse getByOrderId(Integer orderId) {
        Prescription p = prescriptionRepository.findByOnlineOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found for order id " + orderId));
        return toDto(p);
    }

    @Transactional(noRollbackFor = AccessDeniedException.class)
    public PrescriptionResponse getByOrderId(Integer orderId, Integer currentUserId, boolean isStaff) {
        Prescription p = prescriptionRepository.findByOnlineOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found for order id " + orderId));

        if (!isStaff && (p.getCustomer() == null || p.getCustomer().getUser() == null ||
                !p.getCustomer().getUser().getId().equals(currentUserId))) {
            activityLogService.log(currentUserId, "UNAUTHORIZED_PRESCRIPTION_ACCESS", "Prescription", p.getId(),
                    "Attempted unauthorized access to prescription for order id " + orderId, null);
            throw new AccessDeniedException("You do not have permission to view this prescription");
        }

        return toDto(p);
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByCustomer(Integer customerId) {
        return getByCustomer(customerId, null, true);
    }

    @Transactional(noRollbackFor = AccessDeniedException.class)
    public List<PrescriptionResponse> getByCustomer(Integer customerId, Integer currentUserId, boolean isStaff) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + customerId));

        if (!isStaff && (customer.getUser() == null || !customer.getUser().getId().equals(currentUserId))) {
            activityLogService.log(currentUserId, "UNAUTHORIZED_PRESCRIPTION_ACCESS", "Customer", customerId,
                    "Attempted unauthorized access to customer prescriptions", null);
            throw new AccessDeniedException("You do not have permission to view prescriptions for this customer");
        }

        return prescriptionRepository.findByCustomerId(customerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getByStatus(PrescriptionStatus status) {
        return prescriptionRepository.findByStatus(status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrescriptionResponse> getAll() {
        return prescriptionRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public PrescriptionResponse reviewPrescription(Integer id, PrescriptionStatusUpdateRequest req, String reviewerUsername) {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id " + id));

        User reviewer = null;
        if (reviewerUsername != null && !reviewerUsername.isBlank()) {
            reviewer = userRepository.findByUsernameOrEmailWithRole(reviewerUsername).orElse(null);
        }

        prescription.setStatus(req.getStatus());
        prescription.setReviewNotes(req.getReviewNotes());
        prescription.setReviewedBy(reviewer);
        prescription.setReviewedAt(LocalDateTime.now());

        OnlineOrder order = prescription.getOnlineOrder();
        if (order != null) {
            if (req.getStatus() == PrescriptionStatus.APPROVED) {
                if (order.getStatus() == OrderStatus.AWAITING_PRESCRIPTION) {
                    if (order.getPayment() != null &&
                            order.getPayment().getPaymentMethod() == PaymentMethod.BANK_CARD_TRANSACTION &&
                            order.getPayment().getStatus() != PaymentStatus.COMPLETED) {
                        order.setStatus(OrderStatus.PENDING_PAYMENT);
                    } else {
                        order.setStatus(OrderStatus.CONFIRMED);
                    }
                    orderRepository.save(order);
                }
            } else if (req.getStatus() == PrescriptionStatus.REJECTED) {
                order.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(order);
            }
        }

        Prescription saved = prescriptionRepository.save(prescription);

        activityLogService.log(reviewer,
                req.getStatus() == PrescriptionStatus.APPROVED ? "PRESCRIPTION_APPROVED" : "PRESCRIPTION_REJECTED",
                "Prescription", id, "Prescription " + req.getStatus() + ". Notes: " + req.getReviewNotes(), null);

        return toDto(saved);
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private PrescriptionResponse toDto(Prescription p) {
        PrescriptionResponse dto = new PrescriptionResponse();
        dto.setId(p.getId());
        if (p.getOnlineOrder() != null) {
            dto.setOnlineOrderId(p.getOnlineOrder().getId());
            dto.setOrderNumber(p.getOnlineOrder().getOrderNumber());
        }
        if (p.getCustomer() != null) {
            dto.setCustomerId(p.getCustomer().getId());
            dto.setCustomerName(p.getCustomer().getFirstName() + " " + p.getCustomer().getLastName());
        }
        dto.setFilePath(p.getFilePath());
        dto.setOriginalFilename(p.getOriginalFilename());
        dto.setStatus(p.getStatus());
        dto.setUploadedAt(p.getUploadedAt());
        if (p.getReviewedBy() != null) {
            dto.setReviewedById(p.getReviewedBy().getId());
            dto.setReviewedByName(p.getReviewedBy().getUsername());
        }
        dto.setReviewedAt(p.getReviewedAt());
        dto.setReviewNotes(p.getReviewNotes());
        return dto;
    }
}
