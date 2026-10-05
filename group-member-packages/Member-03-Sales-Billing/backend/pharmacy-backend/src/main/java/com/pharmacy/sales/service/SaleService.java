package com.pharmacy.sales.service;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import com.pharmacy.inventory.entity.StockMovement;
import com.pharmacy.inventory.entity.StockMovementType;
import com.pharmacy.inventory.repository.ProductBatchRepository;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.inventory.repository.StockMovementRepository;
import com.pharmacy.promotion.entity.Promotion;
import com.pharmacy.promotion.entity.PromotionUsage;
import com.pharmacy.promotion.repository.PromotionRepository;
import com.pharmacy.promotion.repository.PromotionUsageRepository;
import com.pharmacy.sales.dto.SaleItemRequest;
import com.pharmacy.sales.dto.SaleRequest;
import com.pharmacy.sales.dto.SaleResponse;
import com.pharmacy.sales.entity.Sale;
import com.pharmacy.sales.entity.SaleItem;
import com.pharmacy.sales.entity.SalePayment;
import com.pharmacy.sales.repository.SaleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository batchRepository;
    private final StockMovementRepository stockMovementRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final PromotionRepository promotionRepository;
    private final PromotionUsageRepository promotionUsageRepository;
    private final com.pharmacy.sales.strategy.payment.PaymentStrategyProcessor paymentProcessor;
    private final com.pharmacy.inventory.observer.StockSubject stockSubject;
    /** Template Method Pattern: encapsulates the POS billing calculation algorithm. */
    private final com.pharmacy.sales.billing.PosSaleBillingProcessor billingProcessor;

    public SaleService(SaleRepository saleRepository,
                       ProductRepository productRepository,
                       ProductBatchRepository batchRepository,
                       StockMovementRepository stockMovementRepository,
                       CustomerRepository customerRepository,
                       UserRepository userRepository,
                       PromotionRepository promotionRepository,
                       PromotionUsageRepository promotionUsageRepository,
                       com.pharmacy.sales.strategy.payment.PaymentStrategyProcessor paymentProcessor,
                       com.pharmacy.inventory.observer.StockSubject stockSubject,
                       com.pharmacy.sales.billing.PosSaleBillingProcessor billingProcessor) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.batchRepository = batchRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.customerRepository = customerRepository;
        this.userRepository = userRepository;
        this.promotionRepository = promotionRepository;
        this.promotionUsageRepository = promotionUsageRepository;
        this.paymentProcessor = paymentProcessor;
        this.stockSubject = stockSubject;
        this.billingProcessor = billingProcessor;
    }

    public SaleResponse createSale(SaleRequest req, String staffUsername) {
        User staff = null;
        if (staffUsername != null && !staffUsername.isBlank()) {
            staff = userRepository.findByUsernameOrEmailWithRole(staffUsername)
                    .orElse(null);
        }
        if (staff == null) {
            staff = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No staff user found to record sale"));
        }

        Customer customer = null;
        if (req.getCustomerId() != null) {
            customer = customerRepository.findById(req.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + req.getCustomerId()));
        }

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
            if (promotion.getMinOrderAmount() != null && req.getSubtotal().compareTo(promotion.getMinOrderAmount()) < 0) {
                throw new BusinessException("Order subtotal does not meet minimum order of " + promotion.getMinOrderAmount() + " for this promotion");
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

        // Template Method Pattern: delegate billing calculation to PosSaleBillingProcessor
        com.pharmacy.sales.billing.OrderBillingSummary billing = billingProcessor.computeBilling(req);

        Sale sale = new Sale();
        String saleNumber = "SALE-" + System.currentTimeMillis();
        sale.setSaleNumber(saleNumber);
        sale.setCustomer(customer);
        sale.setStaff(staff);
        sale.setPromotion(promotion);
        sale.setSaleDate(LocalDateTime.now());
        sale.setSubtotal(billing.getSubtotal());
        sale.setDiscountAmount(billing.getDiscountAmount());
        sale.setTaxAmount(billing.getTaxAmount());
        sale.setTotalAmount(billing.getFinalTotal());
        sale.setNotes(req.getNotes());

        for (SaleItemRequest itemReq : req.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + itemReq.getProductId()));

            ProductBatch batch = batchRepository.findById(itemReq.getBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id " + itemReq.getBatchId()));

            if (!batch.getProduct().getId().equals(product.getId())) {
                throw new BusinessException("Batch " + batch.getBatchNumber() + " does not belong to product " + product.getName());
            }

            if (batch.getQuantity() < itemReq.getQuantity()) {
                throw new BusinessException("Insufficient stock in batch " + batch.getBatchNumber() +
                        ". Available: " + batch.getQuantity() + ", requested: " + itemReq.getQuantity());
            }

            // Deduct stock and notify observers (Observer Pattern)
            int oldQty = batch.getQuantity();
            int newQty = oldQty - itemReq.getQuantity();
            batch.setQuantity(newQty);
            batchRepository.save(batch);

            int totalStock = batchRepository.findByProductId(product.getId()).stream().mapToInt(ProductBatch::getQuantity).sum();
            stockSubject.notifyObservers(new com.pharmacy.inventory.observer.StockEvent(
                    product, batch, oldQty, newQty, totalStock,
                    com.pharmacy.inventory.entity.StockMovementType.SALE_OUT, "POS_SALE: " + saleNumber));

            SaleItem item = new SaleItem();
            item.setProduct(product);
            item.setBatch(batch);
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(itemReq.getUnitPrice());
            BigDecimal itemDiscount = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            item.setDiscountAmount(itemDiscount);
            item.setTotalPrice(itemReq.getUnitPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity())).subtract(itemDiscount));

            sale.addItem(item);
        }

        // Process payment via Strategy Pattern
        com.pharmacy.sales.strategy.payment.PaymentProcessingContext pContext =
                com.pharmacy.sales.strategy.payment.PaymentProcessingContext.forSale(
                        req.getTotalAmount(), req.getAmountPaid(), req.getPaymentMethod(),
                        req.getPaymentReference(), customer != null ? customer.getMembershipId() : "WALK-IN");
        com.pharmacy.sales.strategy.payment.PaymentProcessResult pResult = paymentProcessor.processSalePayment(pContext);

        SalePayment payment = new SalePayment();
        payment.setPaymentMethod(req.getPaymentMethod());
        payment.setAmountPaid(pResult.getAmountPaid());
        payment.setChangeGiven(pResult.getChangeGiven());
        payment.setReferenceNumber(pResult.getTransactionReference());
        payment.setPaidAt(LocalDateTime.now());
        sale.setPayment(payment);

        Sale saved = saleRepository.save(sale);

        // Record promotion usage
        if (promotion != null) {
            PromotionUsage usage = new PromotionUsage();
            usage.setPromotion(promotion);
            usage.setCustomer(customer);
            usage.setSale(saved);
            usage.setDiscountApplied(saved.getDiscountAmount() != null ? saved.getDiscountAmount() : BigDecimal.ZERO);
            usage.setUsedAt(LocalDateTime.now());
            promotionUsageRepository.save(usage);
        }

        // Record stock movements
        for (SaleItem item : saved.getItems()) {
            StockMovement movement = new StockMovement();
            movement.setProduct(item.getProduct());
            movement.setBatch(item.getBatch());
            movement.setMovementType(StockMovementType.SALE_OUT);
            movement.setQuantityChange(-item.getQuantity());
            movement.setReferenceType("SALE");
            movement.setReferenceId(saved.getId());
            movement.setPerformedBy(staff);
            movement.setNotes("Sale #" + saved.getSaleNumber());
            stockMovementRepository.save(movement);
        }

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<SaleResponse> getAllSales(Pageable pageable) {
        return saleRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public SaleResponse getSaleById(Integer id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with id " + id));
        return toDto(sale);
    }

    @Transactional(readOnly = true)
    public SaleResponse getSaleByNumber(String saleNumber) {
        Sale sale = saleRepository.findBySaleNumber(saleNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found with number " + saleNumber));
        return toDto(sale);
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> getSalesByCustomer(Integer customerId) {
        customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id " + customerId));
        return saleRepository.findByCustomerId(customerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> getSalesByStaff(Integer staffId) {
        return saleRepository.findByStaffId(staffId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private SaleResponse toDto(Sale s) {
        SaleResponse dto = new SaleResponse();
        dto.setId(s.getId());
        dto.setSaleNumber(s.getSaleNumber());
        if (s.getCustomer() != null) {
            dto.setCustomerId(s.getCustomer().getId());
            dto.setCustomerName(s.getCustomer().getFirstName() + " " + s.getCustomer().getLastName());
        }
        if (s.getStaff() != null) {
            dto.setStaffId(s.getStaff().getId());
            dto.setStaffName(s.getStaff().getUsername());
        }
        if (s.getPromotion() != null) {
            dto.setPromotionId(s.getPromotion().getId());
        }
        dto.setSaleDate(s.getSaleDate());
        dto.setSubtotal(s.getSubtotal());
        dto.setDiscountAmount(s.getDiscountAmount());
        dto.setTaxAmount(s.getTaxAmount());
        dto.setTotalAmount(s.getTotalAmount());
        dto.setNotes(s.getNotes());
        dto.setCreatedAt(s.getCreatedAt());

        if (s.getItems() != null) {
            dto.setItems(s.getItems().stream().map(i -> {
                SaleResponse.SaleItemDto itemDto = new SaleResponse.SaleItemDto();
                itemDto.setId(i.getId());
                itemDto.setProductId(i.getProduct().getId());
                itemDto.setProductName(i.getProduct().getName());
                itemDto.setBatchId(i.getBatch().getId());
                itemDto.setBatchNumber(i.getBatch().getBatchNumber());
                itemDto.setQuantity(i.getQuantity());
                itemDto.setUnitPrice(i.getUnitPrice());
                itemDto.setDiscountAmount(i.getDiscountAmount());
                itemDto.setTotalPrice(i.getTotalPrice());
                return itemDto;
            }).collect(Collectors.toList()));
        }

        if (s.getPayment() != null) {
            SaleResponse.SalePaymentDto payDto = new SaleResponse.SalePaymentDto();
            payDto.setId(s.getPayment().getId());
            payDto.setPaymentMethod(s.getPayment().getPaymentMethod());
            payDto.setAmountPaid(s.getPayment().getAmountPaid());
            payDto.setChangeGiven(s.getPayment().getChangeGiven());
            payDto.setReferenceNumber(s.getPayment().getReferenceNumber());
            payDto.setPaidAt(s.getPayment().getPaidAt());
            dto.setPayment(payDto);
        }

        return dto;
    }
}
