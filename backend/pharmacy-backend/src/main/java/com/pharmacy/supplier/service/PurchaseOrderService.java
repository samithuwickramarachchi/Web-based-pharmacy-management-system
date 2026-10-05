package com.pharmacy.supplier.service;

import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import com.pharmacy.inventory.entity.StockMovement;
import com.pharmacy.inventory.entity.StockMovementType;
import com.pharmacy.inventory.repository.ProductBatchRepository;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.inventory.repository.StockMovementRepository;
import com.pharmacy.supplier.dto.*;
import com.pharmacy.supplier.entity.*;
import com.pharmacy.supplier.repository.PurchaseOrderItemRepository;
import com.pharmacy.supplier.repository.PurchaseOrderRepository;
import com.pharmacy.supplier.repository.SupplierRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final PurchaseOrderItemRepository poItemRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository batchRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;
    /** Factory Method Pattern: delegates PO creation to concrete creators based on order characteristics */
    private final com.pharmacy.supplier.factory.PurchaseOrderFactoryProvider poFactoryProvider;

    public PurchaseOrderService(PurchaseOrderRepository poRepository,
                                PurchaseOrderItemRepository poItemRepository,
                                SupplierRepository supplierRepository,
                                ProductRepository productRepository,
                                ProductBatchRepository batchRepository,
                                StockMovementRepository stockMovementRepository,
                                UserRepository userRepository,
                                com.pharmacy.supplier.factory.PurchaseOrderFactoryProvider poFactoryProvider) {
        this.poRepository = poRepository;
        this.poItemRepository = poItemRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.batchRepository = batchRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
        this.poFactoryProvider = poFactoryProvider;
    }

    public PurchaseOrderDto create(PurchaseOrderRequest req, String orderedByUsername) {
        Supplier supplier = supplierRepository.findById(req.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id " + req.getSupplierId()));

        User orderedBy = null;
        if (orderedByUsername != null && !orderedByUsername.isBlank()) {
            orderedBy = userRepository.findByUsernameOrEmailWithRole(orderedByUsername).orElse(null);
        }
        if (orderedBy == null) {
            orderedBy = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("No staff user found to record order"));
        }

        // Factory Method Pattern: instantiate PurchaseOrder via appropriate concrete factory
        PurchaseOrder po = poFactoryProvider.getFactory(req).createPurchaseOrder(req, supplier, orderedBy);

        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseOrderItemRequest itemReq : req.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + itemReq.getProductId()));

            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setProduct(product);
            item.setQuantityOrdered(itemReq.getQuantityOrdered());
            item.setQuantityReceived(0);
            item.setUnitCost(itemReq.getUnitCost());
            BigDecimal lineTotal = itemReq.getUnitCost().multiply(BigDecimal.valueOf(itemReq.getQuantityOrdered()));
            item.setTotalCost(lineTotal);
            total = total.add(lineTotal);

            po.addItem(item);
        }

        po.setTotalAmount(total);
        return toDto(poRepository.save(po));
    }

    @Transactional(readOnly = true)
    public Page<PurchaseOrderDto> getAll(Pageable pageable) {
        return poRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDto getById(Integer id) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id " + id));
        return toDto(po);
    }

    @Transactional(readOnly = true)
    public PurchaseOrderDto getByPoNumber(String poNumber) {
        PurchaseOrder po = poRepository.findByPoNumber(poNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with PO number " + poNumber));
        return toDto(po);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderDto> getBySupplier(Integer supplierId) {
        supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id " + supplierId));
        return poRepository.findBySupplierId(supplierId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderDto> getByStatus(PurchaseOrderStatus status) {
        return poRepository.findByStatus(status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public PurchaseOrderDto updateStatus(Integer id, PurchaseOrderStatus status) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id " + id));

        po.setStatus(status);
        return toDto(poRepository.save(po));
    }

    public PurchaseOrderDto receiveStock(Integer id, ReceiveStockRequest req, String receivedByUsername) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id " + id));

        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BusinessException("Cannot receive stock for a cancelled purchase order");
        }

        User receivedBy = null;
        if (receivedByUsername != null && !receivedByUsername.isBlank()) {
            receivedBy = userRepository.findByUsernameOrEmailWithRole(receivedByUsername).orElse(null);
        }

        for (ReceiveStockItemRequest rItem : req.getItems()) {
            PurchaseOrderItem poItem = po.getItems().stream()
                    .filter(i -> i.getProduct().getId().equals(rItem.getProductId()))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("Product id " + rItem.getProductId() + " is not part of this purchase order"));

            poItem.setQuantityReceived(poItem.getQuantityReceived() + rItem.getQuantityReceived());

            // Create or update batch
            Product product = poItem.getProduct();
            Optional<ProductBatch> optBatch = batchRepository.findByProductIdAndBatchNumber(product.getId(), rItem.getBatchNumber());
            ProductBatch batch;
            if (optBatch.isPresent()) {
                batch = optBatch.get();
                batch.setQuantity(batch.getQuantity() + rItem.getQuantityReceived());
                batch.setCostPrice(rItem.getPurchasePrice());
                if (rItem.getExpiryDate() != null) batch.setExpiryDate(rItem.getExpiryDate());
                if (rItem.getManufacturingDate() != null) batch.setManufactureDate(rItem.getManufacturingDate());
            } else {
                batch = new ProductBatch();
                batch.setProduct(product);
                batch.setBatchNumber(rItem.getBatchNumber());
                batch.setQuantity(rItem.getQuantityReceived());
                batch.setCostPrice(rItem.getPurchasePrice());
                batch.setManufactureDate(rItem.getManufacturingDate());
                batch.setExpiryDate(rItem.getExpiryDate());
                batch.setIsActive(true);
            }
            ProductBatch savedBatch = batchRepository.save(batch);

            // Record stock movement
            StockMovement sm = new StockMovement();
            sm.setProduct(product);
            sm.setBatch(savedBatch);
            sm.setMovementType(StockMovementType.PURCHASE_IN);
            sm.setQuantityChange(rItem.getQuantityReceived());
            sm.setReferenceType("PURCHASE_ORDER");
            sm.setReferenceId(po.getId());
            sm.setPerformedBy(receivedBy);
            sm.setNotes("Received on PO #" + po.getPoNumber());
            stockMovementRepository.save(sm);
        }

        // Determine overall PO status
        boolean allComplete = po.getItems().stream()
                .allMatch(i -> i.getQuantityReceived() >= i.getQuantityOrdered());

        if (allComplete) {
            po.setStatus(PurchaseOrderStatus.RECEIVED);
        } else {
            po.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        }
        po.setReceivedDate(LocalDate.now());

        return toDto(poRepository.save(po));
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private PurchaseOrderDto toDto(PurchaseOrder po) {
        PurchaseOrderDto dto = new PurchaseOrderDto();
        dto.setId(po.getId());
        dto.setPoNumber(po.getPoNumber());
        if (po.getSupplier() != null) {
            dto.setSupplierId(po.getSupplier().getId());
            dto.setSupplierName(po.getSupplier().getName());
        }
        if (po.getOrderedBy() != null) {
            dto.setOrderedById(po.getOrderedBy().getId());
            dto.setOrderedByName(po.getOrderedBy().getUsername());
        }
        dto.setStatus(po.getStatus());
        dto.setOrderDate(po.getOrderDate());
        dto.setExpectedDeliveryDate(po.getExpectedDeliveryDate());
        dto.setReceivedDate(po.getReceivedDate());
        dto.setTotalAmount(po.getTotalAmount());
        dto.setNotes(po.getNotes());
        dto.setCreatedAt(po.getCreatedAt());
        dto.setUpdatedAt(po.getUpdatedAt());

        if (po.getItems() != null) {
            dto.setItems(po.getItems().stream().map(item -> {
                PurchaseOrderItemDto idto = new PurchaseOrderItemDto();
                idto.setId(item.getId());
                idto.setProductId(item.getProduct().getId());
                idto.setProductName(item.getProduct().getName());
                idto.setProductSku(item.getProduct().getSku());
                idto.setQuantityOrdered(item.getQuantityOrdered());
                idto.setQuantityReceived(item.getQuantityReceived());
                idto.setUnitCost(item.getUnitCost());
                idto.setTotalCost(item.getTotalCost());
                return idto;
            }).collect(Collectors.toList()));
        }

        return dto;
    }
}
