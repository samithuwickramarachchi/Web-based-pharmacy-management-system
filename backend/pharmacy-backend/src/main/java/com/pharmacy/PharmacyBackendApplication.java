package com.pharmacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Web-Based Pharmacy Management System backend.
 *
 * <p>This Spring Boot application serves as the REST API backend for the pharmacy system.
 * It handles all business logic and data persistence for the following modules:</p>
 * <ul>
 *   <li>Customer Management</li>
 *   <li>Inventory Management</li>
 *   <li>Sales and Billing</li>
 *   <li>Supplier Management</li>
 *   <li>Discount and Promotion Management</li>
 *   <li>Delivery Management</li>
 * </ul>
 */
@SpringBootApplication
public class PharmacyBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(PharmacyBackendApplication.class, args);
    }

}
