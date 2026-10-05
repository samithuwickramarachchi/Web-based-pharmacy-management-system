package com.pharmacy.supplier.dto;

import com.pharmacy.supplier.entity.PurchaseOrderStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PurchaseOrderDto {
    private Integer id;
    private String poNumber;
    private Integer supplierId;
    private String supplierName;
    private Integer orderedById;
    private String orderedByName;
    private PurchaseOrderStatus status;
    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;
    private LocalDate receivedDate;
    private BigDecimal totalAmount;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PurchaseOrderItemDto> items;

    public PurchaseOrderDto() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }

    public Integer getSupplierId() { return supplierId; }
    public void setSupplierId(Integer supplierId) { this.supplierId = supplierId; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public Integer getOrderedById() { return orderedById; }
    public void setOrderedById(Integer orderedById) { this.orderedById = orderedById; }

    public String getOrderedByName() { return orderedByName; }
    public void setOrderedByName(String orderedByName) { this.orderedByName = orderedByName; }

    public PurchaseOrderStatus getStatus() { return status; }
    public void setStatus(PurchaseOrderStatus status) { this.status = status; }

    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }

    public LocalDate getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(LocalDate expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }

    public LocalDate getReceivedDate() { return receivedDate; }
    public void setReceivedDate(LocalDate receivedDate) { this.receivedDate = receivedDate; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<PurchaseOrderItemDto> getItems() { return items; }
    public void setItems(List<PurchaseOrderItemDto> items) { this.items = items; }
}
