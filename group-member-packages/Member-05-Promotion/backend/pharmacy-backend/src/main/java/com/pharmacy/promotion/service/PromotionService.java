package com.pharmacy.promotion.service;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.exception.DuplicateResourceException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.promotion.dto.CouponValidateRequest;
import com.pharmacy.promotion.dto.CouponValidateResponse;
import com.pharmacy.promotion.dto.PromotionDto;
import com.pharmacy.promotion.dto.PromotionRequest;
import com.pharmacy.promotion.entity.DiscountType;
import com.pharmacy.promotion.entity.Promotion;
import com.pharmacy.promotion.entity.PromotionUsage;
import com.pharmacy.promotion.repository.PromotionRepository;
import com.pharmacy.promotion.repository.PromotionUsageRepository;
import com.pharmacy.sales.entity.OnlineOrder;
import com.pharmacy.sales.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository usageRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final com.pharmacy.promotion.strategy.DiscountContext discountContext;

    public PromotionService(PromotionRepository promotionRepository,
                            PromotionUsageRepository usageRepository,
                            ProductRepository productRepository,
                            UserRepository userRepository,
                            CustomerRepository customerRepository,
                            com.pharmacy.promotion.strategy.DiscountContext discountContext) {
        this.promotionRepository = promotionRepository;
        this.usageRepository = usageRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.discountContext = discountContext;
    }

    @Transactional(readOnly = true)
    public Page<PromotionDto> getAll(Pageable pageable) {
        return promotionRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<PromotionDto> getActive() {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository.findByIsActiveTrueAndValidFromBeforeAndValidUntilAfter(now, now).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PromotionDto getById(Integer id) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with id " + id));
        return toDto(p);
    }

    @Transactional(readOnly = true)
    public PromotionDto getByCode(String code) {
        Promotion p = promotionRepository.findByCouponCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with code " + code));
        return toDto(p);
    }

    public PromotionDto create(PromotionRequest req, String username) {
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            if (promotionRepository.existsByCouponCode(req.getCouponCode().trim().toUpperCase())) {
                throw new DuplicateResourceException("Coupon code '" + req.getCouponCode() + "' is already in use");
            }
        }

        User user = null;
        if (username != null && !username.isBlank()) {
            user = userRepository.findByUsernameOrEmailWithRole(username).orElse(null);
        }
        if (user == null) {
            user = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No staff user found"));
        }

        Promotion p = new Promotion();
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            p.setCouponCode(req.getCouponCode().trim().toUpperCase());
        }
        p.setDiscountType(req.getDiscountType());
        p.setDiscountValue(req.getDiscountValue());
        p.setMinOrderAmount(req.getMinOrderAmount());
        p.setMaxDiscountCap(req.getMaxDiscountCap());
        p.setMaxTotalUses(req.getMaxTotalUses());
        p.setMaxUsesPerCustomer(req.getMaxUsesPerCustomer() != null ? req.getMaxUsesPerCustomer() : 1);
        p.setAppliesToAllProducts(req.getAppliesToAllProducts() != null ? req.getAppliesToAllProducts() : true);
        p.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        p.setValidFrom(req.getValidFrom());
        p.setValidUntil(req.getValidUntil());
        p.setCreatedBy(user);

        if (req.getEligibleProductIds() != null && !req.getEligibleProductIds().isEmpty()) {
            Set<Product> products = new HashSet<>(productRepository.findAllById(req.getEligibleProductIds()));
            p.setEligibleProducts(products);
        }

        return toDto(promotionRepository.save(p));
    }

    public PromotionDto update(Integer id, PromotionRequest req) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with id " + id));

        if (req.getCouponCode() != null && !req.getCouponCode().isBlank()) {
            String newCode = req.getCouponCode().trim().toUpperCase();
            if (!newCode.equalsIgnoreCase(p.getCouponCode()) && promotionRepository.existsByCouponCode(newCode)) {
                throw new DuplicateResourceException("Coupon code '" + newCode + "' is already in use");
            }
            p.setCouponCode(newCode);
        } else {
            p.setCouponCode(null);
        }

        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setDiscountType(req.getDiscountType());
        p.setDiscountValue(req.getDiscountValue());
        p.setMinOrderAmount(req.getMinOrderAmount());
        p.setMaxDiscountCap(req.getMaxDiscountCap());
        p.setMaxTotalUses(req.getMaxTotalUses());
        p.setMaxUsesPerCustomer(req.getMaxUsesPerCustomer() != null ? req.getMaxUsesPerCustomer() : 1);
        p.setAppliesToAllProducts(req.getAppliesToAllProducts() != null ? req.getAppliesToAllProducts() : true);
        if (req.getIsActive() != null) {
            p.setIsActive(req.getIsActive());
        }
        p.setValidFrom(req.getValidFrom());
        p.setValidUntil(req.getValidUntil());

        if (req.getEligibleProductIds() != null) {
            Set<Product> products = new HashSet<>(productRepository.findAllById(req.getEligibleProductIds()));
            p.setEligibleProducts(products);
        }

        return toDto(promotionRepository.save(p));
    }

    public void delete(Integer id) {
        Promotion p = promotionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Promotion not found with id " + id));
        p.setIsActive(false);
        promotionRepository.save(p);
    }

    public CouponValidateResponse validateCoupon(CouponValidateRequest req) {
        String code = req.getCouponCode().trim().toUpperCase();
        Optional<Promotion> opt = promotionRepository.findByCouponCode(code);
        if (opt.isEmpty()) {
            return CouponValidateResponse.invalid("Invalid coupon code");
        }

        Promotion p = opt.get();
        if (p.getIsActive() != null && !p.getIsActive()) {
            return CouponValidateResponse.invalid("This coupon is no longer active");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(p.getValidFrom())) {
            return CouponValidateResponse.invalid("This coupon is not yet valid");
        }
        if (now.isAfter(p.getValidUntil())) {
            return CouponValidateResponse.invalid("This coupon has expired");
        }

        if (p.getMinOrderAmount() != null && req.getOrderAmount().compareTo(p.getMinOrderAmount()) < 0) {
            return CouponValidateResponse.invalid("Order amount must be at least " + p.getMinOrderAmount() + " to use this coupon");
        }

        if (p.getMaxTotalUses() != null) {
            long totalUses = usageRepository.countByPromotionId(p.getId());
            if (totalUses >= p.getMaxTotalUses()) {
                return CouponValidateResponse.invalid("This coupon has reached its maximum total uses");
            }
        }

        if (req.getCustomerId() != null && p.getMaxUsesPerCustomer() != null) {
            long customerUses = usageRepository.countByPromotionIdAndCustomerId(p.getId(), req.getCustomerId());
            if (customerUses >= p.getMaxUsesPerCustomer()) {
                return CouponValidateResponse.invalid("You have already used this coupon the maximum allowed number of times");
            }
        }

        BigDecimal discount = discountContext.calculate(p, req.getOrderAmount());
        BigDecimal finalAmount = req.getOrderAmount().subtract(discount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

        CouponValidateResponse response = new CouponValidateResponse();
        response.setValid(true);
        response.setPromotionId(p.getId());
        response.setCouponCode(p.getCouponCode());
        response.setDiscountType(p.getDiscountType());
        response.setDiscountValue(p.getDiscountValue());
        response.setCalculatedDiscount(discount);
        response.setFinalAmount(finalAmount);
        response.setMessage("Coupon applied successfully");
        return response;
    }

    public void recordUsage(Integer promotionId, Integer customerId, BigDecimal discount) {
        Promotion p = promotionRepository.findById(promotionId).orElse(null);
        if (p == null) return;

        Customer customer = null;
        if (customerId != null) {
            customer = customerRepository.findById(customerId).orElse(null);
        }

        recordUsage(p, customer, null, null, discount);
    }

    public void recordUsage(Promotion promotion, Customer customer, Sale sale, OnlineOrder onlineOrder, BigDecimal discount) {
        if (promotion == null) return;

        PromotionUsage usage = new PromotionUsage();
        usage.setPromotion(promotion);
        usage.setCustomer(customer);
        usage.setSale(sale);
        usage.setOnlineOrder(onlineOrder);
        usage.setDiscountApplied(discount != null ? discount : BigDecimal.ZERO);
        usage.setUsedAt(LocalDateTime.now());
        usageRepository.save(usage);
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private PromotionDto toDto(Promotion p) {
        PromotionDto dto = new PromotionDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setDescription(p.getDescription());
        dto.setCouponCode(p.getCouponCode());
        dto.setDiscountType(p.getDiscountType());
        dto.setDiscountValue(p.getDiscountValue());
        dto.setMinOrderAmount(p.getMinOrderAmount());
        dto.setMaxDiscountCap(p.getMaxDiscountCap());
        dto.setMaxTotalUses(p.getMaxTotalUses());
        dto.setMaxUsesPerCustomer(p.getMaxUsesPerCustomer());
        dto.setAppliesToAllProducts(p.getAppliesToAllProducts());
        dto.setIsActive(p.getIsActive());
        dto.setValidFrom(p.getValidFrom());
        dto.setValidUntil(p.getValidUntil());
        dto.setCurrentUsageCount(usageRepository.countByPromotionId(p.getId()));
        if (p.getCreatedBy() != null) {
            dto.setCreatedById(p.getCreatedBy().getId());
            dto.setCreatedByName(p.getCreatedBy().getUsername());
        }
        dto.setCreatedAt(p.getCreatedAt());

        if (p.getEligibleProducts() != null) {
            dto.setEligibleProductIds(p.getEligibleProducts().stream()
                    .map(Product::getId)
                    .collect(Collectors.toSet()));
        }

        return dto;
    }
}
