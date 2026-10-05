package com.pharmacy.customer.service;

import com.pharmacy.auth.dto.CustomerRegisterRequest;
import com.pharmacy.auth.entity.Role;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.RoleRepository;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.exception.BusinessException;
import com.pharmacy.common.exception.DuplicateResourceException;
import com.pharmacy.common.exception.ResourceNotFoundException;
import com.pharmacy.common.repository.ActivityLogRepository;
import com.pharmacy.common.service.ActivityLogService;
import com.pharmacy.customer.dto.*;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.entity.CustomerAddress;
import com.pharmacy.customer.repository.CustomerAddressRepository;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import com.pharmacy.sales.repository.PrescriptionRepository;
import com.pharmacy.sales.repository.SaleRepository;
import com.pharmacy.sales.repository.ShoppingCartRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerAddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OnlineOrderRepository onlineOrderRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ShoppingCartRepository cartRepository;
    private final SaleRepository saleRepository;
    private final ActivityLogService activityLogService;
    private final ActivityLogRepository activityLogRepository;
    /** Strategy Pattern: resolves loyalty tier definitions and qualification rules */
    private final com.pharmacy.customer.strategy.loyalty.LoyaltyTierContext loyaltyTierContext;

    public CustomerService(CustomerRepository customerRepository,
                           CustomerAddressRepository addressRepository,
                           PasswordEncoder passwordEncoder,
                           UserRepository userRepository,
                           RoleRepository roleRepository,
                           OnlineOrderRepository onlineOrderRepository,
                           PrescriptionRepository prescriptionRepository,
                           ShoppingCartRepository cartRepository,
                           SaleRepository saleRepository,
                           ActivityLogService activityLogService,
                           ActivityLogRepository activityLogRepository,
                           com.pharmacy.customer.strategy.loyalty.LoyaltyTierContext loyaltyTierContext) {
        this.customerRepository = customerRepository;
        this.addressRepository = addressRepository;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.onlineOrderRepository = onlineOrderRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.cartRepository = cartRepository;
        this.saleRepository = saleRepository;
        this.activityLogService = activityLogService;
        this.activityLogRepository = activityLogRepository;
        this.loyaltyTierContext = loyaltyTierContext;
    }

    // ─── Registration ────────────────────────────────────────────────────────────

    public Customer registerCustomer(CustomerRegisterRequest req, String ipAddress) {
        String normalizedEmail = req.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateResourceException("Email is already registered. Please log in instead.");
        }
        if (userRepository.existsByUsername(normalizedEmail)) {
            throw new DuplicateResourceException("Email is already registered. Please log in instead.");
        }

        // Split name into first and last name
        String fullName = req.getName().trim();
        String firstName;
        String lastName;
        int firstSpace = fullName.indexOf(' ');
        if (firstSpace > 0) {
            firstName = fullName.substring(0, firstSpace).trim();
            lastName = fullName.substring(firstSpace + 1).trim();
        } else {
            firstName = fullName;
            lastName = fullName;
        }

        // Find or create CUSTOMER role
        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseGet(() -> roleRepository.save(new Role("CUSTOMER", "Registered Customer")));

        // Create User
        User user = new User();
        user.setUsername(normalizedEmail);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(customerRole);
        user.setIsActive(true);
        User savedUser = userRepository.saveAndFlush(user);

        // Generate unique membership ID
        String membershipId = generateMembershipId();

        // Create Customer
        Customer customer = new Customer();
        customer.setUser(savedUser);
        customer.setFirstName(firstName);
        customer.setLastName(lastName);
        customer.setPhone(req.getPhone() != null ? req.getPhone().trim() : null);
        customer.setMembershipId(membershipId);
        Customer savedCustomer = customerRepository.saveAndFlush(customer);

        // Add primary address if provided
        if (req.getAddress() != null && !req.getAddress().trim().isEmpty()) {
            CustomerAddress address = new CustomerAddress();
            address.setCustomer(savedCustomer);
            address.setLabel("Home");
            address.setAddressLine1(req.getAddress().trim());
            address.setCity("Colombo");
            address.setIsDefault(true);
            addressRepository.saveAndFlush(address);
        }

        // Log registration after commit so the User FK is resolvable in the REQUIRES_NEW sub-transaction
        final User logUser = savedUser;
        final Integer logCustomerId = savedCustomer.getId();
        final String logDetails = String.format("{\"membershipId\":\"%s\",\"email\":\"%s\"}", membershipId, normalizedEmail);
        final String logIp = ipAddress;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        activityLogService.log(logUser, "CUSTOMER_REGISTERED", "customer", logCustomerId, logDetails, logIp);
                    } catch (Exception ignored) {
                        // Non-critical audit log — never block the committed registration
                    }
                }
            });
        }

        return savedCustomer;
    }

    private String generateMembershipId() {
        int year = LocalDate.now().getYear();
        Random random = new Random();
        String candidate;
        int attempts = 0;
        do {
            int randomDigits = 1000 + random.nextInt(9000);
            candidate = String.format("MEM-%d-%04d", year, randomDigits);
            attempts++;
        } while (customerRepository.existsByMembershipId(candidate) && attempts < 50);
        return candidate;
    }

    // ─── List & Get ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<CustomerDto> getAll(Pageable pageable) {
        return customerRepository.findByUserIsActiveTrue(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public CustomerDto getById(Integer id) {
        Customer c = findCustomer(id);
        return toDto(c);
    }

    @Transactional(readOnly = true)
    public CustomerDto getByUserId(Integer userId) {
        Customer c = customerRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile not found for user ID " + userId));
        if (c.getUser() != null && Boolean.FALSE.equals(c.getUser().getIsActive())) {
            throw new ResourceNotFoundException("Customer account is deactivated or deleted");
        }
        return toDto(c);
    }

    @Transactional(readOnly = true)
    public List<CustomerDto> searchCustomers(String query, String name, String phone, String membershipId) {
        boolean hasQuery = query != null && !query.trim().isEmpty();
        boolean hasName = name != null && !name.trim().isEmpty();
        boolean hasPhone = phone != null && !phone.trim().isEmpty();
        boolean hasMembershipId = membershipId != null && !membershipId.trim().isEmpty();

        if (!hasQuery && !hasName && !hasPhone && !hasMembershipId) {
            return Collections.emptyList();
        }

        Set<Customer> resultSet = new LinkedHashSet<>();

        if (hasQuery) {
            resultSet.addAll(customerRepository.searchGeneralActive(query.trim()));
        }
        if (hasName) {
            resultSet.addAll(customerRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(name.trim(), name.trim()));
        }
        if (hasPhone) {
            resultSet.addAll(customerRepository.findByPhoneContaining(phone.trim()));
        }
        if (hasMembershipId) {
            resultSet.addAll(customerRepository.findByMembershipIdContainingIgnoreCase(membershipId.trim()));
        }

        return resultSet.stream()
                .filter(c -> c.getUser() != null && Boolean.TRUE.equals(c.getUser().getIsActive()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ─── Update Profile ──────────────────────────────────────────────────────────

    public CustomerDto updateProfile(Integer id, CustomerUpdateRequest req) {
        Customer c = findCustomer(id);
        if (req.getFirstName() != null) c.setFirstName(req.getFirstName());
        if (req.getLastName() != null)  c.setLastName(req.getLastName());
        if (req.getPhone() != null)     c.setPhone(req.getPhone());
        if (req.getDateOfBirth() != null) c.setDateOfBirth(req.getDateOfBirth());
        return toDto(customerRepository.save(c));
    }

    // ─── Delete / Deactivate Customer ───────────────────────────────────────────

    public void deleteCustomer(Integer id) {
        deleteCustomer(id, null, null);
    }

    public void deleteCustomer(Integer id, Integer staffUserId, String ipAddress) {
        Customer c = findCustomer(id);
        User user = c.getUser();
        User staff = staffUserId != null ? userRepository.findById(staffUserId).orElse(null) : null;

        boolean hasOrders = !onlineOrderRepository.findByCustomerId(id).isEmpty();
        boolean hasPrescriptions = !prescriptionRepository.findByCustomerId(id).isEmpty();
        boolean hasSales = !saleRepository.findByCustomerId(id).isEmpty();
        boolean hasHistoricalRecords = hasOrders || hasPrescriptions || hasSales;

        // Clean up transient active shopping cart if any
        cartRepository.findByCustomerId(id).ifPresent(cartRepository::delete);

        if (hasHistoricalRecords) {
            // Soft delete / safe deactivation: keeps orders, payments, prescriptions, deliveries intact
            if (user != null) {
                user.setIsActive(false);
                userRepository.save(user);
            }
            String details = String.format("{\"customerId\":%d,\"membershipId\":\"%s\",\"name\":\"%s %s\",\"reason\":\"Customer deactivated due to existing historical records (orders/prescriptions/sales)\"}",
                    id,
                    c.getMembershipId() != null ? c.getMembershipId() : "",
                    c.getFirstName() != null ? c.getFirstName() : "",
                    c.getLastName() != null ? c.getLastName() : "");
            activityLogService.log(staff, "CUSTOMER_DEACTIVATED", "customer", id, details, ipAddress);
        } else {
            // Normal hard delete: no historical records exist
            if (user != null) {
                activityLogRepository.findByUserId(user.getId()).forEach(log -> {
                    log.setUser(null);
                    activityLogRepository.save(log);
                });
            }

            String details = String.format("{\"customerId\":%d,\"membershipId\":\"%s\",\"name\":\"%s %s\",\"reason\":\"Customer hard deleted (no historical records)\"}",
                    id,
                    c.getMembershipId() != null ? c.getMembershipId() : "",
                    c.getFirstName() != null ? c.getFirstName() : "",
                    c.getLastName() != null ? c.getLastName() : "");
            activityLogService.log(staff, "CUSTOMER_DELETED", "customer", id, details, ipAddress);

            customerRepository.delete(c);
            if (user != null) {
                userRepository.delete(user);
            }
        }
    }

    // ─── Change Password ─────────────────────────────────────────────────────────

    public void changePassword(Integer id, ChangePasswordRequest req) {
        Customer c = findCustomer(id);
        String storedHash = c.getUser().getPasswordHash();
        if (!passwordEncoder.matches(req.getCurrentPassword(), storedHash)) {
            throw new BusinessException("Current password is incorrect");
        }
        c.getUser().setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
    }

    // ─── Addresses ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(Integer customerId) {
        findCustomer(customerId);
        return addressRepository.findByCustomerId(customerId)
                .stream().map(this::toAddressResponse).collect(Collectors.toList());
    }

    public AddressResponse addAddress(Integer customerId, AddressRequest req) {
        Customer c = findCustomer(customerId);
        CustomerAddress addr = new CustomerAddress();
        mapAddressRequest(req, addr);
        addr.setCustomer(c);

        // If this is set as default, clear other defaults
        if (Boolean.TRUE.equals(req.getIsDefault())) {
            clearDefaultAddresses(customerId);
            addr.setIsDefault(true);
        } else {
            addr.setIsDefault(false);
        }
        return toAddressResponse(addressRepository.save(addr));
    }

    public AddressResponse updateAddress(Integer customerId, Integer addressId, AddressRequest req) {
        findCustomer(customerId);
        CustomerAddress addr = findAddress(customerId, addressId);
        mapAddressRequest(req, addr);
        if (Boolean.TRUE.equals(req.getIsDefault())) {
            clearDefaultAddresses(customerId);
            addr.setIsDefault(true);
        }
        return toAddressResponse(addressRepository.save(addr));
    }

    public void deleteAddress(Integer customerId, Integer addressId) {
        findCustomer(customerId);
        CustomerAddress addr = findAddress(customerId, addressId);
        addressRepository.delete(addr);
    }

    public AddressResponse setDefaultAddress(Integer customerId, Integer addressId) {
        findCustomer(customerId);
        clearDefaultAddresses(customerId);
        CustomerAddress addr = findAddress(customerId, addressId);
        addr.setIsDefault(true);
        return toAddressResponse(addressRepository.save(addr));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    public Customer findCustomer(Integer id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    private CustomerAddress findAddress(Integer customerId, Integer addressId) {
        return addressRepository.findByIdAndCustomerId(addressId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Address " + addressId + " not found for customer " + customerId));
    }

    private void clearDefaultAddresses(Integer customerId) {
        addressRepository.findByCustomerIdAndIsDefaultTrue(customerId)
                .forEach(a -> { a.setIsDefault(false); addressRepository.save(a); });
    }

    private void mapAddressRequest(AddressRequest req, CustomerAddress addr) {
        if (req.getLabel() != null) addr.setLabel(req.getLabel());
        if (req.getAddressLine1() != null) addr.setAddressLine1(req.getAddressLine1());
        addr.setAddressLine2(req.getAddressLine2());
        if (req.getCity() != null) addr.setCity(req.getCity());
        addr.setPostalCode(req.getPostalCode());
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────────

    public CustomerDto toDto(Customer c) {
        CustomerDto dto = new CustomerDto();
        dto.setId(c.getId());
        dto.setUserId(c.getUser().getId());
        dto.setEmail(c.getUser().getEmail());
        dto.setFirstName(c.getFirstName());
        dto.setLastName(c.getLastName());
        dto.setPhone(c.getPhone());
        dto.setDateOfBirth(c.getDateOfBirth());
        dto.setMembershipId(c.getMembershipId());
        int points = c.getLoyaltyPoints() != null ? c.getLoyaltyPoints() : 0;
        dto.setLoyaltyPoints(points);
        String tier = c.getMembershipTier() != null && !c.getMembershipTier().isBlank()
                ? c.getMembershipTier()
                : loyaltyTierContext.determineTierName(points);
        dto.setMembershipTier(tier);
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        dto.setIsActive(c.getUser() != null && Boolean.TRUE.equals(c.getUser().getIsActive()));
        // Embed addresses so the list response includes address counts and city info
        List<AddressResponse> addresses = addressRepository.findByCustomerId(c.getId())
                .stream().map(this::toAddressResponse).collect(Collectors.toList());
        dto.setAddresses(addresses);
        return dto;
    }

    /**
     * Recalculates and persists customer loyalty tier based on LoyaltyTierStrategy.
     */
    public CustomerDto updateLoyaltyTier(Integer customerId) {
        Customer c = findCustomer(customerId);
        int points = c.getLoyaltyPoints() != null ? c.getLoyaltyPoints() : 0;
        c.setMembershipTier(loyaltyTierContext.determineTierName(points));
        return toDto(customerRepository.save(c));
    }

    private AddressResponse toAddressResponse(CustomerAddress a) {
        AddressResponse r = new AddressResponse();
        r.setId(a.getId());
        r.setLabel(a.getLabel());
        r.setAddressLine1(a.getAddressLine1());
        r.setAddressLine2(a.getAddressLine2());
        r.setCity(a.getCity());
        r.setPostalCode(a.getPostalCode());
        r.setIsDefault(a.getIsDefault());
        r.setCreatedAt(a.getCreatedAt());
        return r;
    }
}
