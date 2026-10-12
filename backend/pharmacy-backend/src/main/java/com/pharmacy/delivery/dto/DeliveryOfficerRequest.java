package com.pharmacy.delivery.dto;

import com.pharmacy.delivery.entity.DeliveryOfficerStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DeliveryOfficerRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 150, message = "Full name must not exceed 150 characters")
    private String fullName;

    @NotBlank(message = "Phone is required")
    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;

    @Email(message = "Email must be valid")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    @Size(max = 50, message = "Vehicle type must not exceed 50 characters")
    private String vehicleType;

    @Size(max = 30, message = "Vehicle number must not exceed 30 characters")
    private String vehicleNumber;

    private DeliveryOfficerStatus status = DeliveryOfficerStatus.ACTIVE;

    public DeliveryOfficerRequest() {}

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
}
