package com.pharmacy.inventory.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public class ProductRequest {

    @NotNull(message = "Category ID is required")
    private Integer categoryId;

    private Integer manufacturerId;

    @NotBlank(message = "Product name is required")
    @Size(max = 200)
    private String name;

    @NotBlank(message = "SKU is required")
    @Size(max = 60)
    private String sku;

    private String description;

    @Size(max = 200)
    private String dosageInfo;

    @NotBlank(message = "Unit is required")
    @Size(max = 30)
    private String unit;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.00", inclusive = false, message = "Price must be positive")
    private BigDecimal sellingPrice;

    private Boolean requiresPrescription;
    private Integer minReorderLevel;
    private Boolean isActive;

    public ProductRequest() {}

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public Integer getManufacturerId() { return manufacturerId; }
    public void setManufacturerId(Integer manufacturerId) { this.manufacturerId = manufacturerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDosageInfo() { return dosageInfo; }
    public void setDosageInfo(String dosageInfo) { this.dosageInfo = dosageInfo; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getSellingPrice() { return sellingPrice; }
    public void setSellingPrice(BigDecimal sellingPrice) { this.sellingPrice = sellingPrice; }

    public Boolean getRequiresPrescription() { return requiresPrescription; }
    public void setRequiresPrescription(Boolean requiresPrescription) { this.requiresPrescription = requiresPrescription; }

    public Integer getMinReorderLevel() { return minReorderLevel; }
    public void setMinReorderLevel(Integer minReorderLevel) { this.minReorderLevel = minReorderLevel; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
}
