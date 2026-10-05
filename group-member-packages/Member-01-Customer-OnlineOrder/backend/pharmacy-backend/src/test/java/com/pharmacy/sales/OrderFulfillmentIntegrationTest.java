package com.pharmacy.sales;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmacy.auth.dto.CustomerRegisterRequest;
import com.pharmacy.auth.entity.Role;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.RoleRepository;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.repository.ActivityLogRepository;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerAddressRepository;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.delivery.entity.Delivery;
import com.pharmacy.delivery.entity.DeliveryStatus;
import com.pharmacy.delivery.repository.DeliveryRepository;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import com.pharmacy.inventory.repository.ProductBatchRepository;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.inventory.repository.StockMovementRepository;
import com.pharmacy.sales.dto.CartItemRequest;
import com.pharmacy.sales.dto.OnlineOrderCreateRequest;
import com.pharmacy.sales.entity.OnlineOrder;
import com.pharmacy.sales.entity.OrderStatus;
import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import com.pharmacy.sales.repository.PaymentRepository;
import com.pharmacy.sales.repository.PrescriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:order_fulfillment_testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class OrderFulfillmentIntegrationTest {

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
    private ProductRepository productRepository;

    @Autowired
    private ProductBatchRepository batchRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private OnlineOrderRepository orderRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private DeliveryRepository deliveryRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private String customerToken;
    private String adminToken;
    private Customer testCustomer;
    private Product testProduct;

    @BeforeEach
    void setUp() throws Exception {
        deliveryRepository.deleteAll();
        paymentRepository.deleteAll();
        stockMovementRepository.deleteAll();
        prescriptionRepository.deleteAll();
        orderRepository.deleteAll();
        batchRepository.deleteAll();
        productRepository.deleteAll();
        activityLogRepository.deleteAll();
        customerAddressRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role custRole = roleRepository.save(new Role("CUSTOMER", "Customer"));
        Role adminRole = roleRepository.save(new Role("ADMIN", "Admin"));

        // Register customer
        CustomerRegisterRequest reg = new CustomerRegisterRequest(
                "Kamal Silva",
                "kamal@pharmacy.com",
                "0771234567",
                "45 Galle Road, Colombo",
                "Password123"
        );
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        customerToken = objectMapper.readTree(regRes.getResponse().getContentAsString()).get("accessToken").asText();
        testCustomer = customerRepository.findByUserId(
                userRepository.findByEmail("kamal@pharmacy.com").orElseThrow().getId()
        ).orElseThrow();

        // Create admin user
        User adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@pharmacy.com");
        adminUser.setPasswordHash(passwordEncoder.encode("AdminPass123"));
        adminUser.setRole(adminRole);
        adminUser.setIsActive(true);
        userRepository.save(adminUser);

        // Login as admin
        MvcResult adminLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"AdminPass123\"}"))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminLoginRes.getResponse().getContentAsString()).get("accessToken").asText();

        // Create product with stock
        testProduct = new Product();
        testProduct.setName("Panadol 500mg");
        testProduct.setSku("PAN-500");
        testProduct.setUnit("Card");
        testProduct.setSellingPrice(new BigDecimal("150.00"));
        testProduct.setRequiresPrescription(false);
        testProduct.setMinReorderLevel(5);
        testProduct.setIsActive(true);
        testProduct = productRepository.save(testProduct);

        ProductBatch batch = new ProductBatch();
        batch.setProduct(testProduct);
        batch.setBatchNumber("BATCH-PAN-01");
        batch.setQuantity(50);
        batch.setCostPrice(new BigDecimal("100.00"));
        batch.setExpiryDate(LocalDate.now().plusMonths(12));
        batch.setIsActive(true);
        batchRepository.save(batch);
    }

    // ─── Scenario A: Customer selects DELIVERY ───────────────────────────────────

    @Test
    @DisplayName("Scenario A: DELIVERY order created successfully, delivery address retained, delivery record created")
    void testA_CustomerSelectsDelivery_Success() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setDeliveryAddress("45 Galle Road, Colombo");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), 2)));

        MvcResult res = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.fulfillmentType").value("DELIVERY"))
                .andExpect(jsonPath("$.deliveryAddress").value("45 Galle Road, Colombo"))
                .andReturn();

        Integer orderId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asInt();

        // Verify entity in DB
        OnlineOrder savedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(savedOrder.getFulfillmentType()).isEqualTo("DELIVERY");
        assertThat(savedOrder.getDeliveryAddress()).isEqualTo("45 Galle Road, Colombo");

        // Verify Delivery record exists in Delivery workflow
        List<Delivery> deliveries = deliveryRepository.findAll();
        assertThat(deliveries).hasSize(1);
        Delivery delivery = deliveries.get(0);
        assertThat(delivery.getOnlineOrder().getId()).isEqualTo(orderId);
        assertThat(delivery.getDeliveryAddress()).isEqualTo("45 Galle Road, Colombo");
        assertThat(delivery.getStatus()).isEqualTo(DeliveryStatus.PENDING);
    }

    // ─── Scenario B: Customer selects STORE PICKUP ───────────────────────────────

    @Test
    @DisplayName("Scenario B: STORE_PICKUP order created successfully, no delivery record created")
    void testB_CustomerSelectsStorePickup_Success() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setFulfillmentType("STORE_PICKUP");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), 3)));

        MvcResult res = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.fulfillmentType").value("STORE_PICKUP"))
                .andReturn();

        Integer orderId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asInt();

        // Verify entity in DB
        OnlineOrder savedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(savedOrder.getFulfillmentType()).isEqualTo("STORE_PICKUP");
        assertThat(savedOrder.getDelivery()).isNull();

        // Verify NO Delivery record was created
        List<Delivery> deliveries = deliveryRepository.findAll();
        assertThat(deliveries).isEmpty();
    }

    // ─── Scenario C: Customer does not select an option ─────────────────────────

    @Test
    @DisplayName("Scenario C: Missing fulfillmentType rejected")
    void testC_MissingFulfillmentType_Rejected() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setFulfillmentType(null); // Not selected
        orderReq.setDeliveryAddress("45 Galle Road, Colombo");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), 1)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Fulfillment type is required")));

        // Also test empty string fulfillmentType
        orderReq.setFulfillmentType("   ");
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Fulfillment type is required")));
    }

    // ─── Scenario D: DELIVERY without address ───────────────────────────────────

    @Test
    @DisplayName("Scenario D: DELIVERY without address rejected")
    void testD_DeliveryWithoutAddress_Rejected() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setDeliveryAddress(null); // Missing address
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), 1)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Delivery address is required")));

        // Blank address also rejected
        orderReq.setDeliveryAddress("   ");
        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Delivery address is required")));
    }

    // ─── Scenario E: STORE_PICKUP without address ───────────────────────────────

    @Test
    @DisplayName("Scenario E: STORE_PICKUP without address succeeds")
    void testE_StorePickupWithoutAddress_Succeeds() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setFulfillmentType("STORE_PICKUP");
        orderReq.setDeliveryAddress(null); // No address needed
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), 1)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fulfillmentType").value("STORE_PICKUP"));

        // Verify no delivery record
        assertThat(deliveryRepository.count()).isEqualTo(0);
    }

    // ─── Invalid Fulfillment Type Rejection ─────────────────────────────────────

    @Test
    @DisplayName("Invalid fulfillment type rejected")
    void testInvalidFulfillmentType_Rejected() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setFulfillmentType("DRONE_DELIVERY"); // Invalid
        orderReq.setDeliveryAddress("45 Galle Road, Colombo");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), 1)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid fulfillment type")));
    }

    // ─── Scenario F: Existing customer orders still work ─────────────────────────

    @Test
    @DisplayName("Scenario F: Existing customer orders still work and customer can view fulfillment type")
    void testF_ExistingCustomerOrdersStillWork() throws Exception {
        // Place one DELIVERY and one STORE_PICKUP order
        OnlineOrderCreateRequest req1 = new OnlineOrderCreateRequest();
        req1.setCustomerId(testCustomer.getId());
        req1.setFulfillmentType("DELIVERY");
        req1.setDeliveryAddress("45 Galle Road, Colombo");
        req1.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        req1.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), 1)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        OnlineOrderCreateRequest req2 = new OnlineOrderCreateRequest();
        req2.setCustomerId(testCustomer.getId());
        req2.setFulfillmentType("STORE_PICKUP");
        req2.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        req2.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), 1)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated());

        // Customer views order history
        mockMvc.perform(get("/api/orders/customer/" + testCustomer.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].fulfillmentType", hasItems("DELIVERY", "STORE_PICKUP")));
    }

    // ─── Scenario G: Existing staff/admin order management not broken ───────────

    @Test
    @DisplayName("Scenario G: Staff can view orders with fulfillment type and update status")
    void testG_StaffOrderManagement_NotBroken() throws Exception {
        // Place a STORE_PICKUP order
        OnlineOrderCreateRequest req = new OnlineOrderCreateRequest();
        req.setCustomerId(testCustomer.getId());
        req.setFulfillmentType("STORE_PICKUP");
        req.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        req.setItems(Collections.singletonList(new CartItemRequest(testProduct.getId(), 2)));

        MvcResult res = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer orderId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asInt();

        // Staff lists all orders
        mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].fulfillmentType").value("STORE_PICKUP"));

        // Staff updates status to CONFIRMED
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"CONFIRMED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.fulfillmentType").value("STORE_PICKUP"));

        // Staff updates status to DELIVERED (pickup completed)
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"DELIVERED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));

        // Ensure no delivery record was created or modified erroneously
        assertThat(deliveryRepository.count()).isEqualTo(0);
    }
}
