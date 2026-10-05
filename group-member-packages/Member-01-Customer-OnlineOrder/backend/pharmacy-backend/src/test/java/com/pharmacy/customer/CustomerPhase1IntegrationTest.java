package com.pharmacy.customer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmacy.auth.dto.CustomerRegisterRequest;
import com.pharmacy.auth.entity.Role;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.RoleRepository;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.auth.security.JwtTokenProvider;
import com.pharmacy.common.entity.ActivityLog;
import com.pharmacy.common.repository.ActivityLogRepository;
import com.pharmacy.customer.dto.CustomerUpdateRequest;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.entity.CustomerAddress;
import com.pharmacy.customer.repository.CustomerAddressRepository;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.sales.entity.OnlineOrder;
import com.pharmacy.sales.entity.OrderStatus;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:customer_testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class CustomerPhase1IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerAddressRepository customerAddressRepository;

    @Autowired
    private OnlineOrderRepository onlineOrderRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private Role customerRole;
    private Role adminRole;

    @BeforeEach
    void setUp() {
        activityLogRepository.deleteAll();
        onlineOrderRepository.deleteAll();
        customerAddressRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        customerRole = roleRepository.save(new Role("CUSTOMER", "Registered Customer"));
        adminRole = roleRepository.save(new Role("ADMIN", "Administrator"));
    }

    private String createTestToken(User user, String roleName) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                com.pharmacy.auth.security.CustomUserDetails.create(user),
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
        return jwtTokenProvider.generateToken(auth);
    }

    // ─── 1. Customer Registration Tests ──────────────────────────────────────────

    @Test
    void testRegisterCustomer_Success() throws Exception {
        CustomerRegisterRequest request = new CustomerRegisterRequest(
                "Kasun Perera",
                "kasun@example.com",
                "0771234567",
                "123 Galle Road, Colombo",
                "Password123"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.email").value("kasun@example.com"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andReturn();

        // Verify Customer entity created in DB
        User user = userRepository.findByEmail("kasun@example.com").orElseThrow();
        assertThat(passwordEncoder.matches("Password123", user.getPasswordHash())).isTrue();

        Customer customer = customerRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(customer.getFirstName()).isEqualTo("Kasun");
        assertThat(customer.getLastName()).isEqualTo("Perera");
        assertThat(customer.getMembershipId()).startsWith("MEM-");

        List<CustomerAddress> addresses = customerAddressRepository.findByCustomerId(customer.getId());
        assertThat(addresses).hasSize(1);
        assertThat(addresses.get(0).getAddressLine1()).isEqualTo("123 Galle Road, Colombo");

        // Verify Activity Log for registration
        List<ActivityLog> logs = activityLogRepository.findByAction("CUSTOMER_REGISTERED");
        assertThat(logs).isNotEmpty();
        assertThat(logs.get(0).getEntityId()).isEqualTo(customer.getId());
    }

    @Test
    void testRegisterCustomer_DuplicateEmail_Returns409() throws Exception {
        // Register first customer
        CustomerRegisterRequest first = new CustomerRegisterRequest(
                "Nimal Silva",
                "duplicate@example.com",
                "0712345678",
                "45 Kandy Rd",
                "Secret123"
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        // Try registering with same email
        CustomerRegisterRequest duplicate = new CustomerRegisterRequest(
                "Another Silva",
                "duplicate@example.com",
                "0719999999",
                "50 Kandy Rd",
                "Secret456"
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email is already registered. Please log in instead."));
    }

    @Test
    void testRegisterCustomer_ValidationFailures() throws Exception {
        // Missing name, invalid email, weak password (<8 chars and no digits)
        CustomerRegisterRequest invalid = new CustomerRegisterRequest(
                "",
                "invalid-email-format",
                "",
                "Address",
                "short"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors.name").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors.password").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors.phone").isNotEmpty());
    }

    @Test
    void testRegisterCustomer_PasswordWithoutNumbers_Fails() throws Exception {
        CustomerRegisterRequest request = new CustomerRegisterRequest(
                "Kamal Silva",
                "kamal@example.com",
                "0771122334",
                "Colombo",
                "AllLettersPassword"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.password").isNotEmpty());
    }

    // ─── 2. Customer Authorization & Profile Access ──────────────────────────────

    @Test
    void testCustomerAccessOwnProfile_Success() throws Exception {
        // Register customer 1
        CustomerRegisterRequest req = new CustomerRegisterRequest(
                "Ruwan Fernando",
                "ruwan@example.com",
                "0779988776",
                "Negombo",
                "RuwanPass123"
        );
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(regResult.getResponse().getContentAsString()).get("accessToken").asText();
        Customer customer = customerRepository.findByUserId(
                userRepository.findByEmail("ruwan@example.com").orElseThrow().getId()
        ).orElseThrow();

        // 1. Access via GET /api/customers/{id}
        mockMvc.perform(get("/api/customers/" + customer.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customer.getId()))
                .andExpect(jsonPath("$.firstName").value("Ruwan"))
                .andExpect(jsonPath("$.email").value("ruwan@example.com"));

        // 2. Access via GET /api/customers/me
        mockMvc.perform(get("/api/customers/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customer.getId()))
                .andExpect(jsonPath("$.firstName").value("Ruwan"));
    }

    @Test
    void testCustomerAccessAnotherCustomer_ForbiddenAndLogged() throws Exception {
        // Create Customer 1
        CustomerRegisterRequest req1 = new CustomerRegisterRequest(
                "Customer One",
                "c1@example.com",
                "0771111111",
                "Address 1",
                "Pass12345"
        );
        MvcResult res1 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated())
                .andReturn();
        String token1 = objectMapper.readTree(res1.getResponse().getContentAsString()).get("accessToken").asText();

        // Create Customer 2
        CustomerRegisterRequest req2 = new CustomerRegisterRequest(
                "Customer Two",
                "c2@example.com",
                "0772222222",
                "Address 2",
                "Pass12345"
        );
        MvcResult res2 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated())
                .andReturn();
        Customer customer2 = customerRepository.findByUserId(
                userRepository.findByEmail("c2@example.com").orElseThrow().getId()
        ).orElseThrow();

        // Customer 1 tries to access Customer 2's profile -> 403 Forbidden
        mockMvc.perform(get("/api/customers/" + customer2.getId())
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isForbidden());

        // Verify unauthorized access attempt was logged in ActivityLog
        List<ActivityLog> logs = activityLogRepository.findByAction("UNAUTHORIZED_CUSTOMER_ACCESS_ATTEMPT");
        assertThat(logs).isNotEmpty();
        ActivityLog securityLog = logs.get(0);
        assertThat(securityLog.getEntityId()).isEqualTo(customer2.getId());
        assertThat(securityLog.getEntityType()).isEqualTo("customer");
    }

    @Test
    void testCustomerUpdateOwnProfile_Success() throws Exception {
        CustomerRegisterRequest req = new CustomerRegisterRequest(
                "Sunil Shantha",
                "sunil@example.com",
                "0773334445",
                "Galle",
                "Pass12345"
        );
        MvcResult res = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = objectMapper.readTree(res.getResponse().getContentAsString()).get("accessToken").asText();
        Customer customer = customerRepository.findByUserId(
                userRepository.findByEmail("sunil@example.com").orElseThrow().getId()
        ).orElseThrow();

        CustomerUpdateRequest updateReq = new CustomerUpdateRequest();
        updateReq.setFirstName("Sunil Updated");
        updateReq.setPhone("0779998887");

        mockMvc.perform(patch("/api/customers/" + customer.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Sunil Updated"))
                .andExpect(jsonPath("$.phone").value("0779998887"));
    }

    // ─── 3. Account Deletion & Order Guard ────────────────────────────────────────

    @Test
    void testAccountDeletion_BlockedWhenOrdersExist() throws Exception {
        // Register customer
        CustomerRegisterRequest req = new CustomerRegisterRequest(
                "Buyer Customer",
                "buyer@example.com",
                "0775556667",
                "Matara",
                "Pass12345"
        );
        MvcResult res = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        String token = objectMapper.readTree(res.getResponse().getContentAsString()).get("accessToken").asText();
        Customer customer = customerRepository.findByUserId(
                userRepository.findByEmail("buyer@example.com").orElseThrow().getId()
        ).orElseThrow();

        // Create an online order for this customer
        OnlineOrder order = new OnlineOrder();
        order.setOrderNumber("ORD-TEST-001");
        order.setCustomer(customer);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setSubtotal(new BigDecimal("1500.00"));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(new BigDecimal("1500.00"));
        order.setDeliveryAddress("Matara");
        order.setRequiresPrescription(false);
        onlineOrderRepository.save(order);

        // 1. Customer itself cannot delete -> 403 Forbidden
        mockMvc.perform(delete("/api/customers/" + customer.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        // 2. Admin deletion of customer with orders triggers safe deactivation -> 204 No Content
        User adminUser = new User();
        adminUser.setUsername("admin_p1_test");
        adminUser.setEmail("admin_p1@pharmacare.lk");
        adminUser.setPasswordHash(passwordEncoder.encode("AdminPass123"));
        adminUser.setRole(adminRole);
        adminUser.setIsActive(true);
        adminUser = userRepository.save(adminUser);
        String adminToken = createTestToken(adminUser, "ADMIN");

        mockMvc.perform(delete("/api/customers/" + customer.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Customer entity is preserved for referential integrity, but user is deactivated
        Customer deactivatedCust = customerRepository.findById(customer.getId()).orElseThrow();
        assertThat(deactivatedCust.getUser().getIsActive()).isFalse();
        // Online order remains intact
        assertThat(onlineOrderRepository.findByCustomerId(customer.getId())).hasSize(1);
    }

    @Test
    void testAccountDeletion_SuccessWhenNoOrders() throws Exception {
        CustomerRegisterRequest req = new CustomerRegisterRequest(
                "Empty Customer",
                "empty@example.com",
                "0770001112",
                "Jaffna",
                "Pass12345"
        );
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        Customer customer = customerRepository.findByUserId(
                userRepository.findByEmail("empty@example.com").orElseThrow().getId()
        ).orElseThrow();

        User adminUser = new User();
        adminUser.setUsername("admin_p1_empty");
        adminUser.setEmail("admin_p1_empty@pharmacare.lk");
        adminUser.setPasswordHash(passwordEncoder.encode("AdminPass123"));
        adminUser.setRole(adminRole);
        adminUser.setIsActive(true);
        adminUser = userRepository.save(adminUser);
        String adminToken = createTestToken(adminUser, "ADMIN");

        // Admin deletes customer without orders -> 204 No Content and hard delete
        mockMvc.perform(delete("/api/customers/" + customer.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Verify customer is hard deleted
        assertThat(customerRepository.findById(customer.getId())).isEmpty();
    }
}
