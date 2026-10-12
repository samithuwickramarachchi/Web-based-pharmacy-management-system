package com.pharmacy.delivery.dto;

import com.pharmacy.delivery.entity.DeliveryOfficerStatus;
import java.time.LocalDateTime;

public class DeliveryOfficerDto {
    private Integer id;
    private String fullName;
    private String phone;
    private String email;
    private String vehicleType;
    private String vehicleNumber;
    private DeliveryOfficerStatus status;
    private long activeDeliveries;
    private long totalDeliveries;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DeliveryOfficerDto() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public DeliveryOfficerStatus getStatus() { return status; }
    public void setStatus(DeliveryOfficerStatus status) { this.status = status; }

    public long getActiveDeliveries() { return activeDeliveries; }
    public void setActiveDeliveries(long activeDeliveries) { this.activeDeliveries = activeDeliveries; }

    public long getTotalDeliveries() { return totalDeliveries; }
    public void setTotalDeliveries(long totalDeliveries) { this.totalDeliveries = totalDeliveries; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
