package com.pharmacy.delivery.service;

import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.DuplicateResourceException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.delivery.dto.DeliveryOfficerDto;
import com.pharmacy.delivery.dto.DeliveryOfficerRequest;
import com.pharmacy.delivery.entity.DeliveryOfficer;
import com.pharmacy.delivery.entity.DeliveryOfficerStatus;
import com.pharmacy.delivery.entity.DeliveryStatus;
import com.pharmacy.delivery.repository.DeliveryOfficerRepository;
import com.pharmacy.delivery.repository.DeliveryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * CRUD for delivery officers. Officers are assigned to deliveries via
 * {@link DeliveryService#assignOfficer}.
 */
@Service
@Transactional
public class DeliveryOfficerService {

    private static final Set<DeliveryStatus> OPEN_STATUSES =
            Set.of(DeliveryStatus.PENDING, DeliveryStatus.OUT_FOR_DELIVERY);

    private final DeliveryOfficerRepository officerRepository;
    private final DeliveryRepository deliveryRepository;

    public DeliveryOfficerService(DeliveryOfficerRepository officerRepository,
                                  DeliveryRepository deliveryRepository) {
        this.officerRepository = officerRepository;
        this.deliveryRepository = deliveryRepository;
    }

    @Transactional(readOnly = true)
    public Page<DeliveryOfficerDto> getAll(Pageable pageable) {
        return officerRepository.findAll(pageable).map(this::toDto);
    }

    /** Officers that can currently be assigned to a delivery. */
    @Transactional(readOnly = true)
    public List<DeliveryOfficerDto> getActive() {
        return officerRepository.findByStatusOrderByFullNameAsc(DeliveryOfficerStatus.ACTIVE)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DeliveryOfficerDto getById(Integer id) {
        return toDto(findOrThrow(id));
    }

    public DeliveryOfficerDto create(DeliveryOfficerRequest req) {
        String phone = req.getPhone().trim();
        String email = normalizeEmail(req.getEmail());

        if (officerRepository.existsByPhone(phone)) {
            throw new DuplicateResourceException("A delivery officer with phone '" + phone + "' already exists");
        }
        if (email != null && officerRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("A delivery officer with email '" + email + "' already exists");
        }

        DeliveryOfficer officer = new DeliveryOfficer();
        apply(officer, req, phone, email);
        return toDto(officerRepository.save(officer));
    }

    public DeliveryOfficerDto update(Integer id, DeliveryOfficerRequest req) {
        DeliveryOfficer officer = findOrThrow(id);
        String phone = req.getPhone().trim();
        String email = normalizeEmail(req.getEmail());

        if (officerRepository.existsByPhoneAndIdNot(phone, id)) {
            throw new DuplicateResourceException("A delivery officer with phone '" + phone + "' already exists");
        }
        if (email != null && officerRepository.existsByEmailAndIdNot(email, id)) {
            throw new DuplicateResourceException("A delivery officer with email '" + email + "' already exists");
        }

        // Taking an officer off duty while they still hold open deliveries would strand those parcels.
        DeliveryOfficerStatus newStatus = req.getStatus() != null ? req.getStatus() : DeliveryOfficerStatus.ACTIVE;
        if (newStatus != DeliveryOfficerStatus.ACTIVE && officer.getStatus() == DeliveryOfficerStatus.ACTIVE
                && openDeliveries(id) > 0) {
            throw new BusinessException("Cannot set " + officer.getFullName() + " to " + newStatus
                    + " while they still have pending or out-for-delivery deliveries. Reassign those first.");
        }

        apply(officer, req, phone, email);
        return toDto(officerRepository.save(officer));
    }

    public void delete(Integer id) {
        DeliveryOfficer officer = findOrThrow(id);
        if (openDeliveries(id) > 0) {
            throw new BusinessException("Cannot delete " + officer.getFullName()
                    + " because they still have pending or out-for-delivery deliveries. Reassign those first.");
        }
        // Completed deliveries keep their history; the FK is ON DELETE SET NULL.
        officerRepository.delete(officer);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private DeliveryOfficer findOrThrow(Integer id) {
        return officerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery officer not found with id " + id));
    }

    private long openDeliveries(Integer officerId) {
        return deliveryRepository.countByDeliveryOfficerIdAndStatusIn(officerId, OPEN_STATUSES);
    }

    private String normalizeEmail(String email) {
        return (email == null || email.isBlank()) ? null : email.trim().toLowerCase();
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private void apply(DeliveryOfficer officer, DeliveryOfficerRequest req, String phone, String email) {
        officer.setFullName(req.getFullName().trim());
        officer.setPhone(phone);
        officer.setEmail(email);
        officer.setVehicleType(blankToNull(req.getVehicleType()));
        officer.setVehicleNumber(blankToNull(req.getVehicleNumber()));
        officer.setStatus(req.getStatus() != null ? req.getStatus() : DeliveryOfficerStatus.ACTIVE);
    }

    private DeliveryOfficerDto toDto(DeliveryOfficer o) {
        DeliveryOfficerDto dto = new DeliveryOfficerDto();
        dto.setId(o.getId());
        dto.setFullName(o.getFullName());
        dto.setPhone(o.getPhone());
        dto.setEmail(o.getEmail());
        dto.setVehicleType(o.getVehicleType());
        dto.setVehicleNumber(o.getVehicleNumber());
        dto.setStatus(o.getStatus());
        dto.setActiveDeliveries(openDeliveries(o.getId()));
        dto.setTotalDeliveries(deliveryRepository.countByDeliveryOfficerId(o.getId()));
        dto.setCreatedAt(o.getCreatedAt());
        dto.setUpdatedAt(o.getUpdatedAt());
        return dto;
    }
}
