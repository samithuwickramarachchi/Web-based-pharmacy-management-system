package com.pharmacy.inventory.service;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.DuplicateResourceException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.inventory.dto.*;
import com.pharmacy.inventory.entity.*;
import com.pharmacy.inventory.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ManufacturerRepository manufacturerRepository;
    private final ProductBatchRepository batchRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    private final com.pharmacy.inventory.observer.StockSubject stockSubject;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          ManufacturerRepository manufacturerRepository,
                          ProductBatchRepository batchRepository,
                          StockMovementRepository stockMovementRepository,
                          UserRepository userRepository,
                          com.pharmacy.inventory.observer.StockSubject stockSubject) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.manufacturerRepository = manufacturerRepository;
        this.batchRepository = batchRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
        this.stockSubject = stockSubject;
    }

    // ─── Products ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ProductDto> getAll(Pageable pageable) {
        return productRepository.findAll(pageable).map(this::toProductDto);
    }

    @Transactional(readOnly = true)
    public ProductDto getById(Integer id) {
        return toProductDto(findProduct(id));
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getByCategory(Integer categoryId) {
        return productRepository.findByCategoryId(categoryId)
                .stream().map(this::toProductDto).collect(Collectors.toList());
    }

    /**
     * Returns all active products that are at or below their minimum reorder level,
     * based on authoritative available stock (active + non-expired batches only).
     * Used by the Admin/Inventory Manager dashboard.
     */
    @Transactional(readOnly = true)
    public List<ProductDto> getLowStockProducts() {
        LocalDate today = LocalDate.now();

        // Build a productId → availableStock map from one efficient aggregate query
        Map<Integer, Integer> stockMap = new HashMap<>();
        for (Object[] row : batchRepository.sumAvailableStockPerProduct(today)) {
            Integer productId = (Integer) row[0];
            Long total = (Long) row[1];
            stockMap.put(productId, total == null ? 0 : total.intValue());
        }

        return productRepository.findByIsActiveTrue().stream()
                .filter(p -> {
                    int available = stockMap.getOrDefault(p.getId(), 0);
                    int threshold = p.getMinReorderLevel() != null ? p.getMinReorderLevel() : 10;
                    return available <= threshold;
                })
                .map(p -> toProductDtoWithStock(p, stockMap.getOrDefault(p.getId(), 0)))
                .collect(Collectors.toList());
    }

    /**
     * Returns the authoritative available stock for a single product:
     * SUM(batch.quantity) WHERE isActive=true AND (expiryDate IS NULL OR expiryDate >= today).
     */
    @Transactional(readOnly = true)
    public int getAvailableStock(Integer productId) {
        LocalDate today = LocalDate.now();
        return batchRepository.findActiveNonExpiredByProductId(productId, today)
                .stream().mapToInt(ProductBatch::getQuantity).sum();
    }

    public ProductDto create(ProductRequest req) {
        if (productRepository.existsBySku(req.getSku())) {
            throw new DuplicateResourceException("Product already exists with SKU: " + req.getSku());
        }
        Product p = buildProduct(new Product(), req);
        return toProductDto(productRepository.save(p));
    }

    public ProductDto update(Integer id, ProductRequest req) {
        Product p = findProduct(id);
        if (!p.getSku().equals(req.getSku()) && productRepository.existsBySku(req.getSku())) {
            throw new DuplicateResourceException("Product already exists with SKU: " + req.getSku());
        }
        buildProduct(p, req);
        return toProductDto(productRepository.save(p));
    }

    public void deactivate(Integer id) {
        Product p = findProduct(id);
        p.setIsActive(false);
        productRepository.save(p);
    }

    // ─── Batches ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProductBatchDto> getBatches(Integer productId) {
        findProduct(productId);
        return batchRepository.findByProductId(productId)
                .stream().map(this::toBatchDto).collect(Collectors.toList());
    }

    public ProductBatchDto createBatch(Integer productId, ProductBatchRequest req) {
        Product p = findProduct(productId);
        if (batchRepository.findByProductIdAndBatchNumber(productId, req.getBatchNumber()).isPresent()) {
            throw new DuplicateResourceException(
                    "Batch number '" + req.getBatchNumber() + "' already exists for this product");
        }
        ProductBatch batch = new ProductBatch();
        batch.setProduct(p);
        mapBatchRequest(req, batch);

        ProductBatch saved = batchRepository.save(batch);

        // Record stock movement IN
        recordMovement(p, saved, StockMovementType.PURCHASE_IN, req.getQuantity(), "BATCH_RECEIPT", saved.getId(), null);

        // Notify Stock Observers (Observer Pattern) — use authoritative available stock
        int totalStock = getAvailableStock(productId);
        stockSubject.notifyObservers(new com.pharmacy.inventory.observer.StockEvent(
                p, saved, 0, saved.getQuantity(), totalStock, StockMovementType.PURCHASE_IN, "BATCH_RECEIPT"));

        return toBatchDto(saved);
    }

    public ProductBatchDto updateBatch(Integer productId, Integer batchId, ProductBatchRequest req) {
        findProduct(productId);
        ProductBatch batch = batchRepository.findById(batchId)
                .filter(b -> b.getProduct().getId().equals(productId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Batch " + batchId + " not found for product " + productId));
        mapBatchRequest(req, batch);
        ProductBatch updated = batchRepository.save(batch);

        int totalStock = getAvailableStock(productId);
        stockSubject.notifyObservers(new com.pharmacy.inventory.observer.StockEvent(
                batch.getProduct(), updated, batch.getQuantity(), updated.getQuantity(), totalStock, StockMovementType.ADJUSTMENT_IN, "BATCH_UPDATE"));

        return toBatchDto(updated);
    }

    public ProductBatchDto adjustStock(Integer productId, Integer batchId, StockAdjustmentRequest req) {
        findProduct(productId);
        ProductBatch batch = batchRepository.findById(batchId)
                .filter(b -> b.getProduct().getId().equals(productId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Batch " + batchId + " not found for product " + productId));

        int oldQty = batch.getQuantity();
        int newQty = batch.getQuantity() + req.getQuantityDelta();
        if (newQty < 0) {
            throw new BusinessException("Adjustment would result in negative stock");
        }
        batch.setQuantity(newQty);
        batchRepository.save(batch);

        StockMovementType type = req.getQuantityDelta() > 0 ? StockMovementType.ADJUSTMENT_IN : StockMovementType.ADJUSTMENT_OUT;
        recordMovement(batch.getProduct(), batch, type, Math.abs(req.getQuantityDelta()),
                "MANUAL_ADJUSTMENT", null, req.getReason());

        // Notify Stock Observers (Observer Pattern) — use authoritative available stock
        int totalStock = getAvailableStock(productId);
        stockSubject.notifyObservers(new com.pharmacy.inventory.observer.StockEvent(
                batch.getProduct(), batch, oldQty, newQty, totalStock, type, req.getReason()));

        return toBatchDto(batch);
    }

    public void checkAndNotifyLowStock(Integer productId) {
        Product p = findProduct(productId);
        int totalStock = getAvailableStock(productId);
        stockSubject.notifyObservers(new com.pharmacy.inventory.observer.StockEvent(
                p, null, totalStock, totalStock, totalStock, StockMovementType.ADJUSTMENT_OUT, "STOCK_LEVEL_CHECK"));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private Product findProduct(Integer id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    private Product buildProduct(Product p, ProductRequest req) {
        Category cat = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId()));
        p.setCategory(cat);

        if (req.getManufacturerId() != null) {
            Manufacturer m = manufacturerRepository.findById(req.getManufacturerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manufacturer", req.getManufacturerId()));
            p.setManufacturer(m);
        }
        p.setName(req.getName());
        p.setSku(req.getSku());
        p.setDescription(req.getDescription());
        p.setDosageInfo(req.getDosageInfo());
        p.setUnit(req.getUnit());
        p.setSellingPrice(req.getSellingPrice());
        if (req.getRequiresPrescription() != null) p.setRequiresPrescription(req.getRequiresPrescription());
        if (req.getMinReorderLevel() != null) p.setMinReorderLevel(req.getMinReorderLevel());
        if (req.getIsActive() != null) p.setIsActive(req.getIsActive());
        return p;
    }

    private void mapBatchRequest(ProductBatchRequest req, ProductBatch batch) {
        batch.setBatchNumber(req.getBatchNumber());
        batch.setQuantity(req.getQuantity());
        batch.setCostPrice(req.getCostPrice());
        batch.setManufactureDate(req.getManufactureDate());
        batch.setExpiryDate(req.getExpiryDate());
        if (req.getIsActive() != null) batch.setIsActive(req.getIsActive());
    }

    private void recordMovement(Product p, ProductBatch batch, StockMovementType type,
                                 int qty, String refType, Integer refId, String notes) {
        StockMovement sm = new StockMovement();
        sm.setProduct(p);
        sm.setBatch(batch);
        sm.setMovementType(type);
        sm.setQuantityChange(qty);
        sm.setReferenceType(refType);
        sm.setReferenceId(refId);
        sm.setNotes(notes);

        // Attach authenticated user if available
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                userRepository.findByEmail(auth.getName()).ifPresent(sm::setPerformedBy);
            }
        } catch (Exception ignored) {}

        stockMovementRepository.save(sm);
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────────

    /**
     * Maps a Product to a DTO using the authoritative available-stock formula:
     * SUM(batch.quantity) WHERE isActive=true AND (expiryDate IS NULL OR expiryDate >= today).
     * This matches exactly what checkout validation uses.
     */
    public ProductDto toProductDto(Product p) {
        int availableStock = getAvailableStock(p.getId());
        return toProductDtoWithStock(p, availableStock);
    }

    private ProductDto toProductDtoWithStock(Product p, int availableStock) {
        ProductDto dto = new ProductDto();
        dto.setId(p.getId());
        if (p.getCategory() != null) {
            dto.setCategoryId(p.getCategory().getId());
            dto.setCategoryName(p.getCategory().getName());
        }
        if (p.getManufacturer() != null) {
            dto.setManufacturerId(p.getManufacturer().getId());
            dto.setManufacturerName(p.getManufacturer().getName());
        }
        dto.setName(p.getName());
        dto.setSku(p.getSku());
        dto.setDescription(p.getDescription());
        dto.setDosageInfo(p.getDosageInfo());
        dto.setUnit(p.getUnit());
        dto.setSellingPrice(p.getSellingPrice());
        dto.setRequiresPrescription(p.getRequiresPrescription());
        dto.setMinReorderLevel(p.getMinReorderLevel());
        dto.setIsActive(p.getIsActive());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        dto.setTotalStock(availableStock);
        return dto;
    }

    private ProductBatchDto toBatchDto(ProductBatch b) {
        ProductBatchDto dto = new ProductBatchDto();
        dto.setId(b.getId());
        dto.setProductId(b.getProduct().getId());
        dto.setProductName(b.getProduct().getName());
        dto.setBatchNumber(b.getBatchNumber());
        dto.setQuantity(b.getQuantity());
        dto.setCostPrice(b.getCostPrice());
        dto.setManufactureDate(b.getManufactureDate());
        dto.setExpiryDate(b.getExpiryDate());
        dto.setIsActive(b.getIsActive());
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }
}
