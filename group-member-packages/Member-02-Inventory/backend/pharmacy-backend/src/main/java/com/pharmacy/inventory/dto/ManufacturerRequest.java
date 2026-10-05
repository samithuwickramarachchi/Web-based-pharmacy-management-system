package com.pharmacy.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ManufacturerRequest {

    @NotBlank(message = "Manufacturer name is required")
    @Size(max = 150)
    private String name;

    @Size(max = 100)
    private String country;

    @Size(max = 100)
    private String contactEmail;

    @Size(max = 20)
    private String contactPhone;

    public ManufacturerRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
}
