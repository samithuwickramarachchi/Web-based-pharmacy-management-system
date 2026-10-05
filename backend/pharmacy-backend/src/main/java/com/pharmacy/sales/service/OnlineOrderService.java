package com.pharmacy.sales.service;

import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.delivery.entity.Delivery;
import com.pharmacy.delivery.entity.DeliveryStatus;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import com.pharmacy.inventory.entity.StockMovement;
import com.pharmacy.inventory.entity.StockMovementType;
import com.pharmacy.inventory.repository.ProductBatchRepository;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.inventory.repository.StockMovementRepository;
import com.pharmacy.promotion.entity.DiscountType;
import com.pharmacy.promotion.entity.Promotion;
import com.pharmacy.promotion.entity.PromotionUsage;
import com.pharmacy.promotion.repository.PromotionRepository;
import com.pharmacy.promotion.repository.PromotionUsageRepository;
import com.pharmacy.sales.dto.*;
import com.pharmacy.sales.entity.*;
import com.pharmacy.sales.repository.CartItemRepository;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import com.pharmacy.sales.repository.PrescriptionRepository;
import com.pharmacy.sales.repository.ShoppingCartRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class OnlineOrderService {

    private final OnlineOrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository batchRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ShoppingCartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final com.pharmacy.sales.strategy.payment.PaymentStrategyProcessor paymentProcessor;
    private final com.pharmacy.promotion.strategy.DiscountContext discountContext;
    /** Template Method Pattern: encapsulates the online order billing algorithm. */
    private final com.pharmacy.sales.billing.OnlineOrderBillingProcessor billingProcessor;
    /** Strategy Pattern: calculates customer loyalty points and tier transitions based on tier rules */
    private final com.pharmacy.customer.strategy.loyalty.LoyaltyTierContext loyaltyTierContext;

    public OnlineOrderService(OnlineOrderRepository orderRepository,
                              CustomerRepository customerRepository,
                              ProductRepository productRepository,
                              ProductBatchRepository batchRepository,
                              StockMovementRepository stockMovementRepository,
                              ShoppingCartRepository cartRepository,
                              CartItemRepository cartItemRepository,
                              PromotionRepository promotionRepository,
                              PromotionUsageRepository promotionUsageRepository,
                              PrescriptionRepository prescriptionRepository,
                              com.pharmacy.sales.strategy.payment.PaymentStrategyProcessor paymentProcessor,
                              com.pharmacy.promotion.strategy.DiscountContext discountContext,
                              com.pharmacy.sales.billing.OnlineOrderBillingProcessor billingProcessor,
                              com.pharmacy.customer.strategy.loyalty.LoyaltyTierContext loyaltyTierContext) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.batchRepository = batchRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.promotionRepository = promotionRepository;
        this.promotionUsageRepository = promotionUsageRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.paymentProcessor = paymentProcessor;
        this.discountContext = discountContext;
        this.billingProcessor = billingProcessor;
        this.loyaltyTierContext = loyaltyTierContext;
    }

    public OnlineOrderResponse createOrder(OnlineOrderCreateRequest req, Integer customerId) {
        Integer targetCustomerId = (customerId != null) ? customerId : req.getCustomerId();
        if (targetCustomerId == null) {
            throw new BusinessException("Customer ID must be provided");
        }

        Customer customer = customerRepository.findById(targetCustomerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + targetCustomerId));

        List<CartItemRequest> itemsToOrder = req.getItems();
        boolean fromCart = false;

        if (itemsToOrder == null || itemsToOrder.isEmpty()) {
            fromCart = true;
            ShoppingCart cart = cartRepository.findByCustomerId(targetCustomerId)
                    .orElseThrow(() -> new BusinessException("Customer has no shopping cart"));
            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new BusinessException("Shopping cart is empty");
            }
            itemsToOrder = cart.getItems().stream()
                    .map(ci -> new CartItemRequest(ci.getProduct().getId(), ci.getQuantity()))
                    .collect(Collectors.toList());
        }

        if (itemsToOrder == null || itemsToOrder.isEmpty()) {
            throw new BusinessException("Order must contain at least one item");
        }

        // ─── 1. Product & Stock Validation (Re-checking fresh from DB) ──────────────
        LocalDate today = LocalDate.now();
        boolean anyRequiresPrescription = false;

        for (CartItemRequest itemReq : itemsToOrder) {
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new BusinessException("Item quantity must be greater than zero");
            }

            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + itemReq.getProductId()));

            if (product.getIsActive() != null && !product.getIsActive()) {
                throw new BusinessException("Product " + product.getName() + " is inactive");
            }

            if (Boolean.TRUE.equals(product.getRequiresPrescription())) {
                anyRequiresPrescription = true;
            }

            // Lock and verify available stock from active, unexpired batches
            List<ProductBatch> batches = batchRepository.findActiveBatchesForUpdate(product.getId());
            int totalAvailable = batches.stream()
                    .filter(b -> b.getExpiryDate() == null || !b.getExpiryDate().isBefore(today))
                    .mapToInt(ProductBatch::getQuantity)
                    .sum();

            if (totalAvailable == 0) {
                throw new BusinessException("Product " + product.getName() + " is out of stock");
            }
            if (totalAvailable < itemReq.getQuantity()) {
                throw new BusinessException("Insufficient stock for product " + product.getName() +
                        ". Available: " + totalAvailable + ", requested: " + itemReq.getQuantity());
            }
        }

        // ─── 2. Prescription Requirement Check ──────────────────────────────────────
        if (anyRequiresPrescription) {
            boolean hasPrescription = req.getPrescriptionFilePath() != null && !req.getPrescriptionFilePath().trim().isEmpty();
            if (!hasPrescription) {
                throw new BusinessException("Prescription is required for one or more items in the order. Please provide a valid prescription.");
            }
        }

        // ─── 3. Promotion Validation ────────────────────────────────────────────────
        Promotion promotion = null;
        if (req.getPromotionId() != null) {
            promotion = promotionRepository.findById(req.getPromotionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with id " + req.getPromotionId()));

            if (promotion.getIsActive() != null && !promotion.getIsActive()) {
                throw new BusinessException("Selected promotion is inactive");
            }
            LocalDateTime now = LocalDateTime.now();
            if (promotion.getValidFrom() != null && now.isBefore(promotion.getValidFrom())) {
                throw new BusinessException("Selected promotion is not yet valid");
            }
            if (promotion.getValidUntil() != null && now.isAfter(promotion.getValidUntil())) {
                throw new BusinessException("Selected promotion has expired");
            }
            if (promotion.getMaxTotalUses() != null) {
                long totalUses = promotionUsageRepository.countByPromotionId(promotion.getId());
                if (totalUses >= promotion.getMaxTotalUses()) {
                    throw new BusinessException("Selected promotion has reached its maximum total uses");
                }
            }
            if (customer != null && promotion.getMaxUsesPerCustomer() != null) {
                long custUses = promotionUsageRepository.countByPromotionIdAndCustomerId(promotion.getId(), customer.getId());
                if (custUses >= promotion.getMaxUsesPerCustomer()) {
                    throw new BusinessException("Customer has already reached maximum uses for this promotion");
                }
            }
        }

        // ─── 4. Build Online Order & Calculate Pricing ──────────────────────────────
        OnlineOrder order = new OnlineOrder();
        order.setOrderNumber("ORD-" + System.currentTimeMillis());
        order.setCustomer(customer);
        order.setPromotion(promotion);

        // Fulfillment type validation (must be DELIVERY or STORE_PICKUP)
        String rawFulfillmentType = req.getFulfillmentType();
        if (rawFulfillmentType == null || rawFulfillmentType.isBlank()) {
            throw new BusinessException("Fulfillment type is required (DELIVERY or STORE_PICKUP)");
        }
        String fulfillmentType = rawFulfillmentType.trim().toUpperCase();
        if (!"DELIVERY".equals(fulfillmentType) && !"STORE_PICKUP".equals(fulfillmentType)) {
            throw new BusinessException("Invalid fulfillment type: " + rawFulfillmentType + ". Must be DELIVERY or STORE_PICKUP");
        }
        order.setFulfillmentType(fulfillmentType);

        // Address validation based on fulfillment type
        if ("DELIVERY".equals(fulfillmentType)) {
            if (req.getDeliveryAddress() == null || req.getDeliveryAddress().trim().isEmpty()) {
                throw new BusinessException("Delivery address is required for delivery orders");
            }
            order.setDeliveryAddress(req.getDeliveryAddress().trim());
        } else {
            // STORE_PICKUP: delivery address is not required
            order.setDeliveryAddress("STORE PICKUP");
        }
        order.setNotes(req.getNotes());
        order.setPlacedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItemRequest itemReq : itemsToOrder) {
            Product product = productRepository.findById(itemReq.getProductId()).orElseThrow();
            BigDecimal unitPrice = product.getSellingPrice() != null ? product.getSellingPrice() : BigDecimal.ZERO;
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(lineTotal);

            OnlineOrderItem orderItem = new OnlineOrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setDiscountAmount(BigDecimal.ZERO);
            orderItem.setTotalPrice(lineTotal);

            order.addItem(orderItem);
        }

        order.setRequiresPrescription(anyRequiresPrescription);
        order.setSubtotal(subtotal);

        // Template Method Pattern: delegate discount/billing to OnlineOrderBillingProcessor
        // Build a temporary request with resolved items for billing computation
        com.pharmacy.sales.dto.OnlineOrderCreateRequest billingReq = new com.pharmacy.sales.dto.OnlineOrderCreateRequest();
        billingReq.setPromotionId(req.getPromotionId());
        billingReq.setDeliveryAddress(req.getDeliveryAddress() != null ? req.getDeliveryAddress() : "N/A");
        billingReq.setItems(itemsToOrder);
        com.pharmacy.sales.billing.OrderBillingSummary billing = billingProcessor.computeBilling(billingReq);

        BigDecimal discount = billing.getDiscountAmount();
        if (promotion != null && promotion.getMinOrderAmount() != null
                && subtotal.compareTo(promotion.getMinOrderAmount()) < 0) {
            throw new BusinessException("Order subtotal does not meet minimum order of "
                    + promotion.getMinOrderAmount() + " for this promotion");
        }
        order.setDiscountAmount(discount);
        order.setTotalAmount(subtotal.subtract(discount).max(java.math.BigDecimal.ZERO));

        // Initial status workflow
        if (anyRequiresPrescription) {
            order.setStatus(OrderStatus.AWAITING_PRESCRIPTION);
        } else {
            order.setStatus(OrderStatus.PENDING_PAYMENT);
        }

        // Attach Prescription record if required and provided
        if (anyRequiresPrescription && req.getPrescriptionFilePath() != null) {
            Prescription prescription = new Prescription();
            prescription.setCustomer(customer);
            prescription.setFilePath(req.getPrescriptionFilePath().trim());
            prescription.setOriginalFilename(req.getPrescriptionOriginalFilename() != null && !req.getPrescriptionOriginalFilename().trim().isEmpty()
                    ? req.getPrescriptionOriginalFilename().trim()
                    : "prescription.pdf");
            prescription.setStatus(PrescriptionStatus.PENDING);
            prescription.setUploadedAt(LocalDateTime.now());
            order.setPrescription(prescription);
        }

        // Create Payment record via Strategy Pattern
        com.pharmacy.sales.strategy.payment.PaymentProcessingContext pContext =
                com.pharmacy.sales.strategy.payment.PaymentProcessingContext.forOnlineOrder(
                        order.getTotalAmount(), req.getPaymentMethod(), null,
                        customer != null ? customer.getMembershipId() : null);
        com.pharmacy.sales.strategy.payment.PaymentProcessResult pResult = paymentProcessor.processOnlineOrderPayment(pContext);

        Payment payment = new Payment();
        payment.setPaymentMethod(req.getPaymentMethod());
        payment.setAmount(order.getTotalAmount());
        payment.setStatus(pResult.getPaymentStatus());
        payment.setTransactionReference(pResult.getTransactionReference());
        payment.setAttemptedAt(LocalDateTime.now());
        order.setPayment(payment);

        // Create Delivery record only for home delivery orders
        if ("DELIVERY".equals(fulfillmentType)) {
            Delivery delivery = new Delivery();
            delivery.setDeliveryAddress(order.getDeliveryAddress());
            delivery.setStatus(DeliveryStatus.PENDING);
            delivery.setCreatedAt(LocalDateTime.now());
            delivery.setUpdatedAt(LocalDateTime.now());
            order.setDelivery(delivery);
        }

        OnlineOrder saved = orderRepository.save(order);

        // ─── 5. Transactional Stock Deduction (FEFO Order) ───────────────────────────
        for (OnlineOrderItem orderItem : saved.getItems()) {
            Product prod = orderItem.getProduct();
            int remainingToDeduct = orderItem.getQuantity();

            List<ProductBatch> batches = batchRepository.findActiveBatchesForUpdate(prod.getId());
            List<ProductBatch> validBatches = batches.stream()
                    .filter(b -> b.getExpiryDate() == null || !b.getExpiryDate().isBefore(today))
                    .sorted(Comparator.comparing(ProductBatch::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(ProductBatch::getId))
                    .collect(Collectors.toList());

            for (ProductBatch batch : validBatches) {
                if (batch.getQuantity() <= 0) continue;

                int deduct = Math.min(batch.getQuantity(), remainingToDeduct);
                batch.setQuantity(batch.getQuantity() - deduct);
                batchRepository.save(batch);

                StockMovement movement = new StockMovement();
                movement.setProduct(prod);
                movement.setBatch(batch);
                movement.setMovementType(StockMovementType.ONLINE_SALE_OUT);
                movement.setQuantityChange(-deduct);
                movement.setReferenceType("ONLINE_ORDER");
                movement.setReferenceId(saved.getId());
                movement.setPerformedBy(customer.getUser());
                movement.setNotes("Online Order #" + saved.getOrderNumber());
                stockMovementRepository.save(movement);

                remainingToDeduct -= deduct;
                if (remainingToDeduct == 0) break;
            }

            if (remainingToDeduct > 0) {
                throw new BusinessException("Insufficient stock for product " + prod.getName() + " during batch deduction");
            }
        }

        // Record promotion usage
        if (promotion != null) {
            PromotionUsage usage = new PromotionUsage();
            usage.setPromotion(promotion);
            usage.setCustomer(customer);
            usage.setOnlineOrder(saved);
            usage.setDiscountApplied(saved.getDiscountAmount() != null ? saved.getDiscountAmount() : BigDecimal.ZERO);
            usage.setUsedAt(LocalDateTime.now());
            promotionUsageRepository.save(usage);
        }

        // Clear cart if ordered from cart
        if (fromCart) {
            cartRepository.findByCustomerId(targetCustomerId).ifPresent(cart -> {
                cartItemRepository.deleteByCartId(cart.getId());
                cart.getItems().clear();
                cartRepository.save(cart);
            });
        }

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<OnlineOrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public OnlineOrderResponse getOrderById(Integer id) {
        OnlineOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Online order not found with id " + id));
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public OnlineOrderResponse getOrderByNumber(String orderNumber) {
        OnlineOrder order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Online order not found with order number " + orderNumber));
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public List<OnlineOrderResponse> getOrdersByCustomer(Integer customerId) {
        return getOrdersByCustomer(customerId, null, null);
    }

    @Transactional(readOnly = true)
    public List<OnlineOrderResponse> getOrdersByCustomer(Integer customerId, LocalDateTime start, LocalDateTime end) {
        customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + customerId));
        return orderRepository.findByCustomerIdAndDateRange(customerId, start, end).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OnlineOrderResponse> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public OnlineOrderResponse updateOrderStatus(Integer id, OrderStatus newStatus) {
        OnlineOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Online order not found with id " + id));

        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());

        if (newStatus == OrderStatus.OUT_FOR_DELIVERY && order.getDelivery() != null) {
            order.getDelivery().setStatus(DeliveryStatus.OUT_FOR_DELIVERY);
        } else if (newStatus == OrderStatus.DELIVERED) {
            if (order.getDelivery() != null) {
                order.getDelivery().setStatus(DeliveryStatus.DELIVERED);
            }
            awardLoyaltyPoints(order);
        }

        return toDto(orderRepository.save(order));
    }

    @Transactional
    public synchronized boolean awardLoyaltyPoints(Integer orderId) {
        OnlineOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Online order not found with id " + orderId));
        return awardLoyaltyPoints(order);
    }

    @Transactional
    public synchronized boolean awardLoyaltyPoints(OnlineOrder order) {
        if (order == null) {
            return false;
        }

        // Idempotency: never award points twice for the same order
        if (Boolean.TRUE.equals(order.getLoyaltyPointsAwarded())) {
            return false;
        }

        // Only eligible completed / successful orders (not cancelled, refunded, failed)
        if (order.getStatus() == OrderStatus.CANCELLED ||
            order.getStatus() == OrderStatus.REFUNDED ||
            order.getStatus() == OrderStatus.PAYMENT_FAILED) {
            return false;
        }

        Customer customer = order.getCustomer();
        if (customer == null) {
            return false;
        }

        BigDecimal totalAmount = order.getTotalAmount();
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            order.setLoyaltyPointsAwarded(true);
            orderRepository.save(order);
            return false;
        }

        // Strategy Pattern: calculate earned points based on customer's current loyalty tier
        String currentTier = customer.getMembershipTier() != null ? customer.getMembershipTier() : "Standard";
        int pointsToAward = loyaltyTierContext.calculateEarnedPoints(currentTier, totalAmount);
        if (pointsToAward <= 0) {
            pointsToAward = totalAmount.divideToIntegralValue(new BigDecimal("100")).intValue();
        }

        int currentPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        int newPoints = currentPoints + pointsToAward;
        customer.setLoyaltyPoints(newPoints);
        customer.setMembershipTier(loyaltyTierContext.determineTierName(newPoints));
        customerRepository.save(customer);

        order.setLoyaltyPointsAwarded(true);
        orderRepository.save(order);
        return true;
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private OnlineOrderResponse toDto(OnlineOrder o) {
        OnlineOrderResponse dto = new OnlineOrderResponse();
        dto.setId(o.getId());
        dto.setOrderNumber(o.getOrderNumber());
        if (o.getCustomer() != null) {
            dto.setCustomerId(o.getCustomer().getId());
            dto.setCustomerName(o.getCustomer().getFirstName() + " " + o.getCustomer().getLastName());
            dto.setCustomerEmail(o.getCustomer().getUser() != null ? o.getCustomer().getUser().getEmail() : null);
        }
        if (o.getPromotion() != null) {
            dto.setPromotionId(o.getPromotion().getId());
        }
        dto.setStatus(o.getStatus());
        dto.setSubtotal(o.getSubtotal());
        dto.setDiscountAmount(o.getDiscountAmount());
        dto.setTotalAmount(o.getTotalAmount());
        dto.setDeliveryAddress(o.getDeliveryAddress());
        dto.setRequiresPrescription(o.getRequiresPrescription());
        dto.setNotes(o.getNotes());
        dto.setFulfillmentType(o.getFulfillmentType());
        dto.setPlacedAt(o.getPlacedAt());
        dto.setUpdatedAt(o.getUpdatedAt());

        if (o.getItems() != null) {
            dto.setItems(o.getItems().stream().map(item -> {
                OnlineOrderItemDto itemDto = new OnlineOrderItemDto();
                itemDto.setId(item.getId());
                itemDto.setProductId(item.getProduct().getId());
                itemDto.setProductName(item.getProduct().getName());
                itemDto.setQuantity(item.getQuantity());
                itemDto.setUnitPrice(item.getUnitPrice());
                itemDto.setDiscountAmount(item.getDiscountAmount());
                itemDto.setTotalPrice(item.getTotalPrice());
                return itemDto;
            }).collect(Collectors.toList()));
        }

        if (o.getPayment() != null) {
            PaymentDto payDto = new PaymentDto();
            payDto.setId(o.getPayment().getId());
            payDto.setPaymentMethod(o.getPayment().getPaymentMethod());
            payDto.setAmount(o.getPayment().getAmount());
            payDto.setStatus(o.getPayment().getStatus());
            payDto.setTransactionReference(o.getPayment().getTransactionReference());
            payDto.setPaymentGateway(o.getPayment().getPaymentGateway());
            payDto.setAttemptedAt(o.getPayment().getAttemptedAt());
            payDto.setCompletedAt(o.getPayment().getCompletedAt());
            dto.setPayment(payDto);
        }

        if (o.getPrescription() != null) {
            PrescriptionResponse prescDto = new PrescriptionResponse();
            prescDto.setId(o.getPrescription().getId());
            prescDto.setOnlineOrderId(o.getId());
            prescDto.setOrderNumber(o.getOrderNumber());
            if (o.getCustomer() != null) {
                prescDto.setCustomerId(o.getCustomer().getId());
                prescDto.setCustomerName(o.getCustomer().getFirstName() + " " + o.getCustomer().getLastName());
            }
            prescDto.setFilePath(o.getPrescription().getFilePath());
            prescDto.setOriginalFilename(o.getPrescription().getOriginalFilename());
            prescDto.setStatus(o.getPrescription().getStatus());
            prescDto.setUploadedAt(o.getPrescription().getUploadedAt());
            if (o.getPrescription().getReviewedBy() != null) {
                prescDto.setReviewedById(o.getPrescription().getReviewedBy().getId());
                prescDto.setReviewedByName(o.getPrescription().getReviewedBy().getUsername());
            }
            prescDto.setReviewedAt(o.getPrescription().getReviewedAt());
            prescDto.setReviewNotes(o.getPrescription().getReviewNotes());
            dto.setPrescription(prescDto);
        }

        dto.setLoyaltyPointsAwarded(o.getLoyaltyPointsAwarded());

        return dto;
    }
}
