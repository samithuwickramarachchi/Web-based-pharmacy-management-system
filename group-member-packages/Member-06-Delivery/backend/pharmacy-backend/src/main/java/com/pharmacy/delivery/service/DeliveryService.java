package com.pharmacy.delivery.service;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.delivery.dto.DeliveryAssignRequest;
import com.pharmacy.delivery.dto.DeliveryDto;
import com.pharmacy.delivery.dto.DeliveryStatusHistoryDto;
import com.pharmacy.delivery.dto.DeliveryStatusUpdateRequest;
import com.pharmacy.delivery.entity.Delivery;
import com.pharmacy.delivery.entity.DeliveryStatus;
import com.pharmacy.delivery.entity.DeliveryStatusHistory;
import com.pharmacy.delivery.repository.DeliveryRepository;
import com.pharmacy.delivery.repository.DeliveryStatusHistoryRepository;
import com.pharmacy.delivery.state.DeliveryContext;
import com.pharmacy.delivery.state.DeliveredDeliveryState;
import com.pharmacy.delivery.state.DeliveryState;
import com.pharmacy.delivery.state.FailedDeliveryState;
import com.pharmacy.delivery.state.OutForDeliveryState;
import com.pharmacy.delivery.state.PendingDeliveryState;
import com.pharmacy.sales.entity.OnlineOrder;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * DeliveryService manages the full lifecycle of deliveries.
 *
 * <p><b>Design Pattern: State Pattern (Behavioural)</b><br>
 * Status transitions (PENDING → OUT_FOR_DELIVERY → DELIVERED / FAILED) are delegated
 * to concrete {@link DeliveryState} implementations ({@link PendingDeliveryState},
 * {@link OutForDeliveryState}, {@link DeliveredDeliveryState}, {@link FailedDeliveryState})
 * via a {@link DeliveryContext} per operation. Each state enforces its own valid
 * transitions and writes an audit entry, keeping transition rules out of this service.
 * </p>
 */
@Service
@Transactional
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryStatusHistoryRepository historyRepository;
    private final OnlineOrderRepository orderRepository;
    private final UserRepository userRepository;

    // State Pattern: injected concrete states
    private final PendingDeliveryState pendingState;
    private final OutForDeliveryState outForDeliveryState;
    private final DeliveredDeliveryState deliveredState;
    private final FailedDeliveryState failedState;

    public DeliveryService(DeliveryRepository deliveryRepository,
                           DeliveryStatusHistoryRepository historyRepository,
                           OnlineOrderRepository orderRepository,
                           UserRepository userRepository,
                           PendingDeliveryState pendingState,
                           OutForDeliveryState outForDeliveryState,
                           DeliveredDeliveryState deliveredState,
                           FailedDeliveryState failedState) {
        this.deliveryRepository = deliveryRepository;
        this.historyRepository = historyRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.pendingState = pendingState;
        this.outForDeliveryState = outForDeliveryState;
        this.deliveredState = deliveredState;
        this.failedState = failedState;
    }

    // ─── Queries ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<DeliveryDto> getAll(Pageable pageable) {
        return deliveryRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public DeliveryDto getById(Integer id) {
        Delivery d = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id " + id));
        return toDto(d);
    }

    @Transactional(readOnly = true)
    public DeliveryDto getByOrderId(Integer orderId) {
        Delivery d = deliveryRepository.findByOnlineOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found for order id " + orderId));
        return toDto(d);
    }

    @Transactional(readOnly = true)
    public List<DeliveryDto> getByPersonnel(Integer personnelId) {
        return deliveryRepository.findByDeliveryPersonnelId(personnelId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeliveryDto> getByStatus(DeliveryStatus status) {
        return deliveryRepository.findByStatus(status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ─── State Pattern: Personnel Assignment ─────────────────────────────────────

    /**
     * Assigns delivery personnel using the State Pattern.
     * Delegates to the current state so each state can enforce its own rules
     * (e.g. DELIVERED state rejects reassignment).
     */
    public DeliveryDto assignPersonnel(Integer id, DeliveryAssignRequest req, String assignerUsername) {
        Delivery d = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id " + id));

        User personnel = userRepository.findById(req.getDeliveryPersonnelId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Delivery personnel not found with id " + req.getDeliveryPersonnelId()));

        User assigner = null;
        if (assignerUsername != null && !assignerUsername.isBlank()) {
            assigner = userRepository.findByUsernameOrEmailWithRole(assignerUsername).orElse(null);
        }

        // State Pattern: build context with current state, then delegate
        DeliveryContext context = buildContext(d);
        context.getCurrentState().assignPersonnel(
                context, personnel, req.getScheduledDate(),
                req.getNotes(), assigner);

        return toDto(deliveryRepository.save(d));
    }

    // ─── State Pattern: Status Transition ────────────────────────────────────────

    /**
     * Transitions delivery status using the State Pattern.
     * The concrete {@link DeliveryState} matching the delivery's current status
     * validates the requested transition and performs all side effects
     * (audit history, order sync, proof-of-delivery, etc.).
     */
    public DeliveryDto updateStatus(Integer id, DeliveryStatusUpdateRequest req, String changedByUsername) {
        Delivery d = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id " + id));

        User changedBy = null;
        if (changedByUsername != null && !changedByUsername.isBlank()) {
            changedBy = userRepository.findByUsernameOrEmailWithRole(changedByUsername).orElse(null);
        }

        // State Pattern: build context with current state, then delegate transition
        DeliveryContext context = buildContext(d);
        context.getCurrentState().transitionStatus(context, req, changedBy);

        // Persist the order status sync (context.syncOrderState sets it in memory)
        OnlineOrder order = d.getOnlineOrder();
        if (order != null) {
            orderRepository.save(order);
        }

        return toDto(deliveryRepository.save(d));
    }

    // ─── State Pattern: Context Builder ──────────────────────────────────────────

    /**
     * Resolves the current {@link DeliveryStatus} of the given delivery
     * to the appropriate {@link DeliveryState} bean and wraps it in a
     * {@link DeliveryContext} ready for delegation.
     */
    private DeliveryContext buildContext(Delivery delivery) {
        DeliveryState initialState = resolveState(delivery.getStatus());
        return new DeliveryContext(delivery, initialState);
    }

    private DeliveryState resolveState(DeliveryStatus status) {
        if (status == null) return pendingState;
        return switch (status) {
            case PENDING -> pendingState;
            case OUT_FOR_DELIVERY -> outForDeliveryState;
            case DELIVERED -> deliveredState;
            case FAILED -> failedState;
        };
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private DeliveryDto toDto(Delivery d) {
        DeliveryDto dto = new DeliveryDto();
        dto.setId(d.getId());
        if (d.getOnlineOrder() != null) {
            dto.setOnlineOrderId(d.getOnlineOrder().getId());
            dto.setOrderNumber(d.getOnlineOrder().getOrderNumber());
            if (d.getOnlineOrder().getCustomer() != null) {
                dto.setCustomerName(d.getOnlineOrder().getCustomer().getFirstName() + " " + d.getOnlineOrder().getCustomer().getLastName());
                dto.setCustomerPhone(d.getOnlineOrder().getCustomer().getPhone());
            }
        }
        if (d.getDeliveryPersonnel() != null) {
            dto.setDeliveryPersonnelId(d.getDeliveryPersonnel().getId());
            dto.setDeliveryPersonnelName(d.getDeliveryPersonnel().getUsername());
        }
        dto.setDeliveryAddress(d.getDeliveryAddress());
        dto.setStatus(d.getStatus());
        dto.setScheduledDate(d.getScheduledDate());
        dto.setDeliveredAt(d.getDeliveredAt());
        dto.setProofOfDelivery(d.getProofOfDelivery());
        dto.setFailureReason(d.getFailureReason());
        dto.setDelayNotes(d.getDelayNotes());
        dto.setCreatedAt(d.getCreatedAt());
        dto.setUpdatedAt(d.getUpdatedAt());

        List<DeliveryStatusHistory> histories = historyRepository.findByDeliveryIdOrderByChangedAtAsc(d.getId());
        dto.setHistory(histories.stream().map(h -> {
            DeliveryStatusHistoryDto hdto = new DeliveryStatusHistoryDto();
            hdto.setId(h.getId());
            hdto.setDeliveryId(d.getId());
            hdto.setStatus(h.getStatus());
            if (h.getChangedBy() != null) {
                hdto.setChangedById(h.getChangedBy().getId());
                hdto.setChangedByName(h.getChangedBy().getUsername());
            }
            hdto.setChangedAt(h.getChangedAt());
            hdto.setNotes(h.getNotes());
            return hdto;
        }).collect(Collectors.toList()));

        return dto;
    }
}
