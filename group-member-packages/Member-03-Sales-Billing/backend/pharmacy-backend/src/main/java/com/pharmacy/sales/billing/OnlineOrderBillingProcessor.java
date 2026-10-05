package com.pharmacy.sales.billing;

import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.promotion.entity.Promotion;
import com.pharmacy.promotion.repository.PromotionRepository;
import com.pharmacy.promotion.strategy.DiscountContext;
import com.pharmacy.sales.dto.CartItemRequest;
import com.pharmacy.sales.dto.OnlineOrderCreateRequest;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Concrete Template Method implementation for Online Order billing (Behavioral Pattern).
 *
 * <p>Inherits the invariant billing skeleton from {@link AbstractOrderBillingProcessor}
 * and specialises each step for online/home-delivery pharmacy orders:
 * <ul>
 *   <li>Subtotal is computed from live product selling prices in the database.</li>
 *   <li>Discounts are resolved via the {@link DiscountContext} Strategy.</li>
 *   <li>Tax is zero (included in selling price per Sri Lanka standard retail practice).</li>
 *   <li>Delivery charges are flat-rate per local standard but waived in the free-delivery tier.</li>
 * </ul>
 * </p>
 */
@Component
public class OnlineOrderBillingProcessor extends AbstractOrderBillingProcessor<OnlineOrderCreateRequest> {

    private final ProductRepository productRepository;
    private final PromotionRepository promotionRepository;
    private final DiscountContext discountContext;

    public OnlineOrderBillingProcessor(ProductRepository productRepository,
                                       PromotionRepository promotionRepository,
                                       DiscountContext discountContext) {
        this.productRepository = productRepository;
        this.promotionRepository = promotionRepository;
        this.discountContext = discountContext;
    }

    @Override
    protected void validateOrderRequest(OnlineOrderCreateRequest request) {
        if (request == null) {
            throw new BusinessException("Online order request cannot be null");
        }
        if (request.getDeliveryAddress() == null || request.getDeliveryAddress().isBlank()) {
            throw new BusinessException("Delivery address is required for online orders");
        }
        // Items may be null/empty if checkout is from cart — that is valid at this stage
    }

    @Override
    protected BigDecimal calculateSubtotal(OnlineOrderCreateRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            return BigDecimal.ZERO; // Cart-based orders resolve items in the service layer
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (CartItemRequest item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new BusinessException("Product not found with id " + item.getProductId()));
            BigDecimal line = product.getSellingPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            sum = sum.add(line);
        }
        return sum;
    }

    @Override
    protected BigDecimal calculateDiscounts(OnlineOrderCreateRequest request, BigDecimal subtotal, List<String> rules) {
        if (request.getPromotionId() != null) {
            Promotion p = promotionRepository.findById(request.getPromotionId()).orElse(null);
            if (p != null && Boolean.TRUE.equals(p.getIsActive())) {
                BigDecimal discount = discountContext.calculate(p, subtotal);
                rules.add("Coupon " + (p.getCouponCode() != null ? p.getCouponCode() : p.getName())
                        + " (" + p.getDiscountType() + "): LKR " + discount);
                return discount;
            }
        }
        return BigDecimal.ZERO;
    }

    @Override
    protected BigDecimal calculateTaxes(OnlineOrderCreateRequest request, BigDecimal netAmount, List<String> rules) {
        // VAT included in selling price; no separate tax line for pharmacy retail (Sri Lanka)
        return BigDecimal.ZERO;
    }

    @Override
    protected BigDecimal calculateDeliveryCharges(OnlineOrderCreateRequest request, List<String> rules) {
        // Standard local delivery fee; currently waived to preserve API-level total compatibility
        rules.add("Standard Local Delivery: LKR 0.00 (included)");
        return BigDecimal.ZERO;
    }
}
