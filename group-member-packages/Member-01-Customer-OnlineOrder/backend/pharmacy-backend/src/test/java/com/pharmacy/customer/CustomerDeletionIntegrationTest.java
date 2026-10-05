package com.pharmacy.customer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmacy.auth.dto.LoginRequest;
import com.pharmacy.auth.entity.Role;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.RoleRepository;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.auth.security.JwtTokenProvider;
import com.pharmacy.common.entity.ActivityLog;
import com.pharmacy.common.repository.ActivityLogRepository;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.sales.entity.OnlineOrder;
import com.pharmacy.sales.entity.OrderStatus;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:customer_deletion_testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class CustomerDeletionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OnlineOrderRepository onlineOrderRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String customerManagerToken;
    private String salesOfficerToken;
    private String inventoryManagerToken;
    private String deliveryOfficerToken;
    private String customerTokenA;
    private String customerTokenB;

    private User adminUser;
    private User customerManagerUser;
    private Customer customerA; // has no orders -> eligible for hard delete
    private Customer customerB; // has historical orders -> eligible for safe deactivation
    private Customer customerC; // another customer

    @BeforeEach
    void setUp() {
        activityLogRepository.deleteAll();
        onlineOrderRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role adminRole = roleRepository.save(new Role("ADMIN", "Administrator"));
        Role custMgrRole = roleRepository.save(new Role("CUSTOMER_MANAGER", "Customer Manager"));
        Role salesRole = roleRepository.save(new Role("SALES_OFFICER", "Sales Officer"));
        Role invRole = roleRepository.save(new Role("INVENTORY_MANAGER", "Inventory Manager"));
        Role delRole = roleRepository.save(new Role("DELIVERY_OFFICER", "Delivery Officer"));
        Role customerRole = roleRepository.save(new Role("CUSTOMER", "Customer"));

        adminUser = createUser("admin", "admin@pharmacare.lk", adminRole);
        customerManagerUser = createUser("custmgr", "custmgr@pharmacare.lk", custMgrRole);
        User salesUser = createUser("salesoff", "salesoff@pharmacare.lk", salesRole);
        User invUser = createUser("invmgr", "invmgr@pharmacare.lk", invRole);
        User delUser = createUser("deloff", "deloff@pharmacare.lk", delRole);

        adminToken = createToken(adminUser, "ADMIN");
        customerManagerToken = createToken(customerManagerUser, "CUSTOMER_MANAGER");
        salesOfficerToken = createToken(salesUser, "SALES_OFFICER");
        inventoryManagerToken = createToken(invUser, "INVENTORY_MANAGER");
        deliveryOfficerToken = createToken(delUser, "DELIVERY_OFFICER");

        // Customer A: Clean, no orders
        User userA = createUser("test_customer_a", "cust_a@example.com", customerRole);
        customerA = createCustomer(userA, "Nimal", "Perera", "0771112233", "MEM-2026-0001");
        customerTokenA = createToken(userA, "CUSTOMER");

        // Customer B: Has an online order
        User userB = createUser("test_customer_b", "cust_b@example.com", customerRole);
        customerB = createCustomer(userB, "Kamal", "Silva", "0772223344", "MEM-2026-0002");
        customerTokenB = createToken(userB, "CUSTOMER");

        OnlineOrder order = new OnlineOrder();
        order.setOrderNumber("ORD-DEL-0001");
        order.setCustomer(customerB);
        order.setStatus(OrderStatus.DELIVERED);
        order.setSubtotal(new BigDecimal("2500.00"));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(new BigDecimal("2500.00"));
        order.setDeliveryAddress("No. 12, Galle Road, Colombo");
        order.setRequiresPrescription(false);
        onlineOrderRepository.save(order);

        // Customer C: Another unrelated customer
        User userC = createUser("test_customer_c", "cust_c@example.com", customerRole);
        customerC = createCustomer(userC, "Sunil", "Fernando", "0773334455", "MEM-2026-0003");
    }

    private User createUser(String username, String email, Role role) {
        User u = new User();
        u.setUsername(username);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode("Password123!"));
        u.setRole(role);
        u.setIsActive(true);
        return userRepository.save(u);
    }

    private Customer createCustomer(User user, String first, String last, String phone, String membershipId) {
        Customer c = new Customer();
        c.setUser(user);
        c.setFirstName(first);
        c.setLastName(last);
        c.setPhone(phone);
        c.setMembershipId(membershipId);
        c.setLoyaltyPoints(0);
        c.setMembershipTier("Standard");
        return customerRepository.save(c);
    }

    private String createToken(User user, String roleName) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                com.pharmacy.auth.security.CustomUserDetails.create(user),
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
        return jwtTokenProvider.generateToken(auth);
    }

    // ─── 1. Role Authorization Tests ─────────────────────────────────────────────

    @Test
    @DisplayName("Admin can delete a customer without historical records (Hard Delete)")
    void testAdminCanDeleteCustomerWithoutOrders() throws Exception {
        mockMvc.perform(delete("/api/customers/" + customerA.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Hard deleted
        assertThat(customerRepository.findById(customerA.getId())).isEmpty();

        // Audit log created
        List<ActivityLog> logs = activityLogRepository.findAll();
        assertThat(logs).anyMatch(l -> "CUSTOMER_DELETED".equals(l.getAction()) && customerA.getId().equals(l.getEntityId()));
    }

    @Test
    @DisplayName("Customer Manager can delete a customer without historical records")
    void testCustomerManagerCanDeleteCustomerWithoutOrders() throws Exception {
        mockMvc.perform(delete("/api/customers/" + customerA.getId())
                        .header("Authorization", "Bearer " + customerManagerToken))
                .andExpect(status().isNoContent());

        assertThat(customerRepository.findById(customerA.getId())).isEmpty();
    }

    @Test
    @DisplayName("Sales Officer is NOT authorized to delete a customer (403 Forbidden)")
    void testSalesOfficerCannotDeleteCustomer() throws Exception {
        mockMvc.perform(delete("/api/customers/" + customerA.getId())
                        .header("Authorization", "Bearer " + salesOfficerToken))
                .andExpect(status().isForbidden());

        // Verify customer still exists
        assertThat(customerRepository.findById(customerA.getId())).isPresent();
    }

    @Test
    @DisplayName("Inventory Manager is NOT authorized to delete a customer (403 Forbidden)")
    void testInventoryManagerCannotDeleteCustomer() throws Exception {
        mockMvc.perform(delete("/api/customers/" + customerA.getId())
                        .header("Authorization", "Bearer " + inventoryManagerToken))
                .andExpect(status().isForbidden());

        assertThat(customerRepository.findById(customerA.getId())).isPresent();
    }

    @Test
    @DisplayName("Delivery Officer is NOT authorized to delete a customer (403 Forbidden)")
    void testDeliveryOfficerCannotDeleteCustomer() throws Exception {
        mockMvc.perform(delete("/api/customers/" + customerA.getId())
                        .header("Authorization", "Bearer " + deliveryOfficerToken))
                .andExpect(status().isForbidden());

        assertThat(customerRepository.findById(customerA.getId())).isPresent();
    }

    @Test
    @DisplayName("Customer cannot delete another customer (403 Forbidden)")
    void testCustomerCannotDeleteAnotherCustomer() throws Exception {
        mockMvc.perform(delete("/api/customers/" + customerB.getId())
                        .header("Authorization", "Bearer " + customerTokenA))
                .andExpect(status().isForbidden());

        assertThat(customerRepository.findById(customerB.getId())).isPresent();
    }

    @Test
    @DisplayName("Customer cannot delete their own account via staff endpoint (403 Forbidden)")
    void testCustomerCannotDeleteOwnAccountViaStaffEndpoint() throws Exception {
        mockMvc.perform(delete("/api/customers/" + customerA.getId())
                        .header("Authorization", "Bearer " + customerTokenA))
                .andExpect(status().isForbidden());

        assertThat(customerRepository.findById(customerA.getId())).isPresent();
    }

    // ─── 2. Safe Deactivation & Referential Consistency ──────────────────────────

    @Test
    @DisplayName("Admin deleting customer with historical orders triggers Safe Deactivation without violating foreign keys")
    void testAdminDeletingCustomerWithOrdersTriggersSafeDeactivation() throws Exception {
        mockMvc.perform(delete("/api/customers/" + customerB.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Entity is preserved for order FK referential integrity
        Customer preserved = customerRepository.findById(customerB.getId()).orElseThrow();
        assertThat(preserved.getUser().getIsActive()).isFalse();

        // Historical order is preserved intact
        List<OnlineOrder> orders = onlineOrderRepository.findByCustomerId(customerB.getId());
        assertThat(orders).hasSize(1);
        assertThat(orders.get(0).getOrderNumber()).isEqualTo("ORD-DEL-0001");

        // Audit log created with CUSTOMER_DEACTIVATED action
        List<ActivityLog> logs = activityLogRepository.findAll();
        assertThat(logs).anyMatch(l -> "CUSTOMER_DEACTIVATED".equals(l.getAction()) && customerB.getId().equals(l.getEntityId()));
    }

    @Test
    @DisplayName("Deactivated customer no longer appears in active Customer Management list")
    void testDeactivatedCustomerDisappearsFromActiveList() throws Exception {
        // Before deletion, active list has 3 customers
        mockMvc.perform(get("/api/customers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(3));

        // Delete customer B (deactivates)
        mockMvc.perform(delete("/api/customers/" + customerB.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // After deletion, active list has only 2 customers (A and C)
        mockMvc.perform(get("/api/customers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[*].email").value(org.hamcrest.Matchers.not(org.hamcrest.Matchers.hasItem("cust_b@example.com"))))
                .andExpect(jsonPath("$.content[*].email").value(org.hamcrest.Matchers.hasItems("cust_a@example.com", "cust_c@example.com")));
    }

    @Test
    @DisplayName("Deactivated customer cannot log into the system")
    void testDeactivatedCustomerCannotLogin() throws Exception {
        // Deactivate Customer B
        mockMvc.perform(delete("/api/customers/" + customerB.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Attempt login -> fails / disabled account
        LoginRequest loginReq = new LoginRequest();
        loginReq.setUsernameOrEmail("cust_b@example.com");
        loginReq.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Unrelated customers remain completely unaffected by deletion")
    void testUnrelatedCustomersRemainIntact() throws Exception {
        // Delete Customer A
        mockMvc.perform(delete("/api/customers/" + customerA.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Customer C is completely intact
        Customer custC = customerRepository.findById(customerC.getId()).orElseThrow();
        assertThat(custC.getFirstName()).isEqualTo("Sunil");
        assertThat(custC.getUser().getIsActive()).isTrue();
    }
}
