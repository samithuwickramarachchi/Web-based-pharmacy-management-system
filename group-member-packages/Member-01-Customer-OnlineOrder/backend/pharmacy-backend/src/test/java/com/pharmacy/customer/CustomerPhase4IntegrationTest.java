package com.pharmacy.customer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmacy.auth.dto.CustomerRegisterRequest;
import com.pharmacy.auth.entity.Role;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.RoleRepository;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.entity.ActivityLog;
import com.pharmacy.common.repository.ActivityLogRepository;
import com.pharmacy.customer.dto.SupportMessageRequest;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerAddressRepository;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.customer.repository.SupportMessageRepository;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import com.pharmacy.inventory.repository.ProductBatchRepository;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.sales.dto.CartItemRequest;
import com.pharmacy.sales.dto.OnlineOrderCreateRequest;
import com.pharmacy.sales.entity.OnlineOrder;
import com.pharmacy.sales.entity.OrderStatus;
import com.pharmacy.sales.entity.Payment;
import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.PaymentStatus;
import com.pharmacy.sales.entity.Prescription;
import com.pharmacy.sales.entity.PrescriptionStatus;
import com.pharmacy.inventory.repository.StockMovementRepository;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import com.pharmacy.sales.repository.PaymentRepository;
import com.pharmacy.sales.repository.PrescriptionRepository;
import com.pharmacy.sales.service.OnlineOrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:customer_phase4_testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class CustomerPhase4IntegrationTest {

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
    private SupportMessageRepository supportMessageRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductBatchRepository batchRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private OnlineOrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private OnlineOrderService onlineOrderService;

    @Autowired
    private ObjectMapper objectMapper;

    private String customerAToken;
    private Customer customerA;
    private String customerBToken;
    private Customer customerB;
    private String adminToken;
    private Product testProduct;

    @BeforeEach
    void setUp() throws Exception {
        stockMovementRepository.deleteAll();
        supportMessageRepository.deleteAll();
        activityLogRepository.deleteAll();
        paymentRepository.deleteAll();
        prescriptionRepository.deleteAll();
        orderRepository.deleteAll();
        batchRepository.deleteAll();
        productRepository.deleteAll();
        customerAddressRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        roleRepository.save(new Role("CUSTOMER", "Registered Customer"));
        roleRepository.save(new Role("ADMIN", "Administrator"));
        roleRepository.save(new Role("SALES_OFFICER", "Sales Officer"));

        // Register Customer A
        CustomerRegisterRequest regA = new CustomerRegisterRequest(
                "Kasun Perera",
                "kasun@example.com",
                "0771234567",
                "123 Lake Road, Kandy",
                "Password123"
        );
        MvcResult resA = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regA)))
                .andExpect(status().isCreated())
                .andReturn();
        customerAToken = objectMapper.readTree(resA.getResponse().getContentAsString()).get("accessToken").asText();
        customerA = customerRepository.findByUserId(
                userRepository.findByEmail("kasun@example.com").orElseThrow().getId()
        ).orElseThrow();

        // Register Customer B
        CustomerRegisterRequest regB = new CustomerRegisterRequest(
                "Amara Fernando",
                "amara@example.com",
                "0719876543",
                "456 Beach Road, Galle",
                "Password123"
        );
        MvcResult resB = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regB)))
                .andExpect(status().isCreated())
                .andReturn();
        customerBToken = objectMapper.readTree(resB.getResponse().getContentAsString()).get("accessToken").asText();
        customerB = customerRepository.findByUserId(
                userRepository.findByEmail("amara@example.com").orElseThrow().getId()
        ).orElseThrow();

        // Register / Create Admin user
        User adminUser = new User();
        adminUser.setUsername("admin_p4");
        adminUser.setEmail("admin_p4@pharmacy.com");
        adminUser.setPasswordHash("$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG"); // "password"
        adminUser.setRole(roleRepository.findByName("ADMIN").orElseThrow());
        adminUser.setIsActive(true);
        userRepository.save(adminUser);

        // Login Admin
        MvcResult adminLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin_p4\",\"password\":\"password\"}"))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminLoginRes.getResponse().getContentAsString()).get("accessToken").asText();

        // Create test product with high stock
        testProduct = new Product();
        testProduct.setName("Vitamin C 1000mg");
        testProduct.setSku("VIT-C-1000");
        testProduct.setUnit("Bottle");
        testProduct.setIsActive(true);
        testProduct.setRequiresPrescription(false);
        testProduct.setSellingPrice(new BigDecimal("100.00"));
        testProduct = productRepository.save(testProduct);

        ProductBatch batch = new ProductBatch();
        batch.setProduct(testProduct);
        batch.setBatchNumber("BATCH-VITC-01");
        batch.setQuantity(5000);
        batch.setCostPrice(new BigDecimal("75.00"));
        batch.setExpiryDate(LocalDate.now().plusYears(1));
        batch.setIsActive(true);
        batchRepository.save(batch);
    }

    private OnlineOrderCreateRequest createOrderRequest(Integer customerId, int quantity) {
        OnlineOrderCreateRequest req = new OnlineOrderCreateRequest();
        req.setCustomerId(customerId);
        req.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), quantity)));
        req.setFulfillmentType("DELIVERY");
        req.setDeliveryAddress("123 Lake Road, Kandy");
        req.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        req.setNotes("Test order");
        return req;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. Loyalty Calculation (1 pt per Rs.100)
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testLoyaltyCalculation_1PointPer100Rs() throws Exception {
        // Customer A places order for 45 units = Rs. 4,500
        OnlineOrderCreateRequest orderReq = createOrderRequest(customerA.getId(), 45);

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        // Award points upon DELIVERED status
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk());

        // Check customer profile: 4,500 / 100 = 45 points, Tier = Standard
        mockMvc.perform(get("/api/customers/me")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loyaltyPoints").value(45))
                .andExpect(jsonPath("$.membershipTier").value("Standard"));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. Silver Threshold (100+ points)
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testSilverThreshold_100Points() throws Exception {
        // Order for 100 units = Rs. 10,000 -> 100 points
        OnlineOrderCreateRequest orderReq = createOrderRequest(customerA.getId(), 100);

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        // Deliver order
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk());

        // Customer should now be in Silver tier
        mockMvc.perform(get("/api/customers/me")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loyaltyPoints").value(100))
                .andExpect(jsonPath("$.membershipTier").value("Silver"));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. Gold Threshold (500+ points)
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testGoldThreshold_500Points() throws Exception {
        // Order for 550 units = Rs. 55,000 -> 550 points
        OnlineOrderCreateRequest orderReq = createOrderRequest(customerA.getId(), 550);

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        // Deliver order
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELIVERED\"}"))
                .andExpect(status().isOk());

        // Customer should now be in Gold tier
        mockMvc.perform(get("/api/customers/me")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loyaltyPoints").value(550))
                .andExpect(jsonPath("$.membershipTier").value("Gold"));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. Duplicate Loyalty Prevention (Idempotent)
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testDuplicateLoyaltyPrevention_Idempotent() throws Exception {
        OnlineOrderCreateRequest orderReq = createOrderRequest(customerA.getId(), 50);

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        // Award points once
        boolean firstAward = onlineOrderService.awardLoyaltyPoints(orderId);
        assertThat(firstAward).isTrue();

        // Check points = 50
        Customer updatedA = customerRepository.findById(customerA.getId()).orElseThrow();
        assertThat(updatedA.getLoyaltyPoints()).isEqualTo(50);

        // Attempt award second time on same order
        boolean secondAward = onlineOrderService.awardLoyaltyPoints(orderId);
        assertThat(secondAward).isFalse();

        // Points must remain 50
        updatedA = customerRepository.findById(customerA.getId()).orElseThrow();
        assertThat(updatedA.getLoyaltyPoints()).isEqualTo(50);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. Customer Search by Name
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testCustomerSearch_ByName() throws Exception {
        mockMvc.perform(get("/api/customers/search?name=Kasun")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].firstName").value("Kasun"))
                .andExpect(jsonPath("$[0].lastName").value("Perera"))
                .andExpect(jsonPath("$[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$[0].password").doesNotExist());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 6. Customer Search by Phone
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testCustomerSearch_ByPhone() throws Exception {
        mockMvc.perform(get("/api/customers/search?phone=071987")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].firstName").value("Amara"))
                .andExpect(jsonPath("$[0].phone").value("0719876543"));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 7. Customer Search by Membership ID
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testCustomerSearch_ByMembershipId() throws Exception {
        String memId = customerA.getMembershipId();
        assertThat(memId).isNotNull();

        mockMvc.perform(get("/api/customers/search?membershipId=" + memId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].membershipId").value(memId))
                .andExpect(jsonPath("$[0].firstName").value("Kasun"));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 8. No Search Results Cleanly
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testCustomerSearch_NoResultsCleanly() throws Exception {
        mockMvc.perform(get("/api/customers/search?name=NonExistentPerson")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 9. Valid Order Date Range
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testOrderHistory_ValidDateRange() throws Exception {
        // Create an order for Customer A
        OnlineOrder order = new OnlineOrder();
        order.setOrderNumber("ORD-TEST-001");
        order.setCustomer(customerA);
        order.setSubtotal(new BigDecimal("100.00"));
        order.setTotalAmount(new BigDecimal("100.00"));
        order.setDeliveryAddress("123 Lake Road, Kandy");
        order.setStatus(OrderStatus.CONFIRMED);
        order.setPlacedAt(LocalDateTime.of(2026, 5, 10, 14, 0));
        order.setUpdatedAt(LocalDateTime.of(2026, 5, 10, 14, 0));
        orderRepository.save(order);

        // Date range including May 10, 2026
        mockMvc.perform(get("/api/orders/customer/" + customerA.getId())
                        .header("Authorization", "Bearer " + customerAToken)
                        .param("startDate", "2026-05-01")
                        .param("endDate", "2026-05-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].orderNumber").value("ORD-TEST-001"));

        // Date range outside May 2026
        mockMvc.perform(get("/api/orders/customer/" + customerA.getId())
                        .header("Authorization", "Bearer " + customerAToken)
                        .param("startDate", "2026-06-01")
                        .param("endDate", "2026-06-30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 10. Invalid Date Range
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testOrderHistory_InvalidDateRange() throws Exception {
        // Start date after end date -> 400 Bad Request
        mockMvc.perform(get("/api/orders/customer/" + customerA.getId())
                        .header("Authorization", "Bearer " + customerAToken)
                        .param("startDate", "2026-10-01")
                        .param("endDate", "2026-05-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Start date cannot be after end date"));

        // Malformed date string -> 400 Bad Request
        mockMvc.perform(get("/api/orders/customer/" + customerA.getId())
                        .header("Authorization", "Bearer " + customerAToken)
                        .param("startDate", "invalid-date-string")
                        .param("endDate", "2026-05-01"))
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 11. Customer Isolation
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testOrderHistory_CustomerIsolation() throws Exception {
        // Customer A tries to access Customer B's order history -> 403 Forbidden
        mockMvc.perform(get("/api/orders/customer/" + customerB.getId())
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 12. Support Message Creation & Staff Viewing
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testSupportMessageCreation_AndStaffViewing() throws Exception {
        SupportMessageRequest msgReq = new SupportMessageRequest(
                "Delivery Delay Inquiry",
                "Can you please check the estimated delivery time for my recent order?"
        );

        // 1. Customer A submits support message
        mockMvc.perform(post("/api/support-messages")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(msgReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.subject").value("Delivery Delay Inquiry"))
                .andExpect(jsonPath("$.customerName").value("Kasun Perera"))
                .andExpect(jsonPath("$.customerId").value(customerA.getId()));

        // 2. Message appears in database
        var dbMessages = supportMessageRepository.findByCustomerIdOrderByCreatedAtDesc(customerA.getId());
        org.junit.jupiter.api.Assertions.assertFalse(dbMessages.isEmpty(), "Message must be saved in database");
        org.junit.jupiter.api.Assertions.assertEquals("Delivery Delay Inquiry", dbMessages.get(0).getSubject());

        // 3 & 4. Admin/staff can see it & identify the customer
        mockMvc.perform(get("/api/support-messages")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].subject").value("Delivery Delay Inquiry"))
                .andExpect(jsonPath("$.content[0].customerName").value("Kasun Perera"))
                .andExpect(jsonPath("$.content[0].customerId").value(customerA.getId()));

        // Admin/staff can filter/view messages for a specific customer
        mockMvc.perform(get("/api/support-messages/customer/" + customerA.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].subject").value("Delivery Delay Inquiry"))
                .andExpect(jsonPath("$[0].customerName").value("Kasun Perera"));

        // 5. Customer A can see only their own messages
        mockMvc.perform(get("/api/support-messages/my")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].subject").value("Delivery Delay Inquiry"));

        // 6. Another customer (Customer B) cannot see Customer A's message
        mockMvc.perform(get("/api/support-messages/my")
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // Customer B cannot access staff endpoints to view Customer A's messages
        mockMvc.perform(get("/api/support-messages")
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/support-messages/customer/" + customerA.getId())
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isForbidden());
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 13. Audit Logging for Unauthorized Access (Profile, Orders, Prescriptions, Slips)
    // ─────────────────────────────────────────────────────────────────────────────
    @Test
    void testAuditLogging_ForUnauthorizedAccess() throws Exception {
        // A. Unauthorized Profile Access: Customer A tries to get Customer B's profile
        mockMvc.perform(get("/api/customers/" + customerB.getId())
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());

        // B. Unauthorized Orders Access: Customer A tries to get Customer B's orders
        mockMvc.perform(get("/api/orders/customer/" + customerB.getId())
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());

        // Create an order and prescription belonging to Customer B
        OnlineOrder orderB = new OnlineOrder();
        orderB.setOrderNumber("ORD-B-999");
        orderB.setCustomer(customerB);
        orderB.setSubtotal(new BigDecimal("200.00"));
        orderB.setTotalAmount(new BigDecimal("200.00"));
        orderB.setDeliveryAddress("456 Beach Road, Galle");
        orderB.setStatus(OrderStatus.PENDING_PAYMENT);
        orderB.setPlacedAt(LocalDateTime.now());
        orderB.setUpdatedAt(LocalDateTime.now());
        orderB = orderRepository.save(orderB);

        Prescription rxB = new Prescription();
        rxB.setCustomer(customerB);
        rxB.setOnlineOrder(orderB);
        rxB.setFilePath("uploads/prescriptions/rx_b.pdf");
        rxB.setOriginalFilename("rx_b.pdf");
        rxB.setStatus(PrescriptionStatus.PENDING);
        rxB = prescriptionRepository.save(rxB);

        Payment payB = new Payment();
        payB.setOnlineOrder(orderB);
        payB.setPaymentMethod(PaymentMethod.BANK_CARD_TRANSACTION);
        payB.setAmount(new BigDecimal("200.00"));
        payB.setStatus(PaymentStatus.PENDING);
        payB.setTransactionReference("uploads/payment_slips/slip_b.pdf");
        payB = paymentRepository.save(payB);

        // C. Unauthorized Prescription Access: Customer A tries to access Customer B's prescription
        mockMvc.perform(get("/api/prescriptions/" + rxB.getId() + "/file")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());

        // D. Unauthorized Payment Slip Access: Customer A tries to access Customer B's payment slip
        mockMvc.perform(get("/api/orders/" + orderB.getId() + "/payment-slip")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());

        // Verify ActivityLog entries exist for each category
        List<ActivityLog> logs = activityLogRepository.findAll();
        assertThat(logs).isNotEmpty();

        boolean hasProfileAudit = logs.stream()
                .anyMatch(l -> "UNAUTHORIZED_CUSTOMER_ACCESS_ATTEMPT".equals(l.getAction()));
        boolean hasOrderAudit = logs.stream()
                .anyMatch(l -> "UNAUTHORIZED_ORDER_ACCESS".equals(l.getAction()));
        boolean hasRxAudit = logs.stream()
                .anyMatch(l -> "UNAUTHORIZED_PRESCRIPTION_FILE_ACCESS".equals(l.getAction()));
        boolean hasSlipAudit = logs.stream()
                .anyMatch(l -> "UNAUTHORIZED_PAYMENT_SLIP_ACCESS".equals(l.getAction()));

        assertThat(hasProfileAudit).isTrue();
        assertThat(hasOrderAudit).isTrue();
        assertThat(hasRxAudit).isTrue();
        assertThat(hasSlipAudit).isTrue();
    }
}
