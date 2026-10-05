package com.pharmacy.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmacy.auth.dto.CustomerRegisterRequest;
import com.pharmacy.auth.dto.LoginRequest;
import com.pharmacy.auth.entity.Role;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.RoleRepository;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.repository.ActivityLogRepository;
import com.pharmacy.customer.entity.Customer;
import com.pharmacy.customer.repository.CustomerAddressRepository;
import com.pharmacy.customer.repository.CustomerRepository;
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import com.pharmacy.inventory.repository.ProductBatchRepository;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.inventory.repository.StockMovementRepository;
import com.pharmacy.sales.dto.CartItemRequest;
import com.pharmacy.sales.dto.OnlineOrderCreateRequest;
import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.repository.CartItemRepository;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import com.pharmacy.sales.repository.PrescriptionRepository;
import com.pharmacy.sales.repository.ShoppingCartRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:stock_testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class InventoryStockIntegrationTest {

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
    private CustomerAddressRepository customerAddressRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductBatchRepository batchRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private ShoppingCartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OnlineOrderRepository orderRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    private String customerToken;
    private String adminToken;
    private String inventoryManagerToken;
    private Customer testCustomer;

    private Product productAboveThreshold;
    private Product productAtThreshold;
    private Product productBelowThreshold;
    private Product productWithExpiredBatch;
    private Product productStock10;

    @BeforeEach
    void setUp() throws Exception {
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
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
        Role invMgrRole = roleRepository.save(new Role("INVENTORY_MANAGER", "Inventory Manager"));

        // Register Admin
        User admin = new User();
        admin.setUsername("admin");
        admin.setEmail("admin@pharmacy.com");
        admin.setPasswordHash(passwordEncoder.encode("AdminPass123!"));
        admin.setRole(adminRole);
        admin.setIsActive(true);
        userRepository.save(admin);

        // Register Inventory Manager
        User invMgr = new User();
        invMgr.setUsername("invmanager");
        invMgr.setEmail("invmgr@pharmacy.com");
        invMgr.setPasswordHash(passwordEncoder.encode("InvPass123!"));
        invMgr.setRole(invMgrRole);
        invMgr.setIsActive(true);
        userRepository.save(invMgr);

        // Register Customer
        CustomerRegisterRequest reg = new CustomerRegisterRequest(
                "Sahan Jayaweera",
                "sahan@pharmacy.com",
                "0771234567",
                "45 Temple Road, Kelaniya",
                "Password123"
        );
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();
        customerToken = objectMapper.readTree(regRes.getResponse().getContentAsString()).get("accessToken").asText();

        testCustomer = customerRepository.findByUserId(
                userRepository.findByEmail("sahan@pharmacy.com").orElseThrow().getId()
        ).orElseThrow();

        // Login Admin
        LoginRequest adminLogin = new LoginRequest("admin@pharmacy.com", "AdminPass123!");
        MvcResult adminLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminLoginRes.getResponse().getContentAsString()).get("accessToken").asText();

        // Login Inventory Manager
        LoginRequest invLogin = new LoginRequest("invmgr@pharmacy.com", "InvPass123!");
        MvcResult invLoginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invLogin)))
                .andExpect(status().isOk())
                .andReturn();
        inventoryManagerToken = objectMapper.readTree(invLoginRes.getResponse().getContentAsString()).get("accessToken").asText();

        // Create Product Above Threshold (stock 25, min 10)
        productAboveThreshold = createProductWithBatch("Amoxicillin 500mg", "AMX-500", 10, 25, LocalDate.now().plusMonths(12));

        // Create Product At Threshold (stock 10, min 10)
        productAtThreshold = createProductWithBatch("Paracetamol 500mg", "PCM-500", 10, 10, LocalDate.now().plusMonths(12));

        // Create Product Below Threshold (stock 3, min 10)
        productBelowThreshold = createProductWithBatch("Insulin Glargine 100U", "INS-100", 10, 3, LocalDate.now().plusMonths(6));

        // Create Product With Expired Batch: unexpired=4, expired=20, min=10 -> available stock is 4 <= 10 (low stock!)
        productWithExpiredBatch = new Product();
        productWithExpiredBatch.setName("Omeprazole 20mg");
        productWithExpiredBatch.setSku("OMP-020");
        productWithExpiredBatch.setUnit("Pack");
        productWithExpiredBatch.setSellingPrice(new BigDecimal("120.00"));
        productWithExpiredBatch.setRequiresPrescription(false);
        productWithExpiredBatch.setMinReorderLevel(10);
        productWithExpiredBatch.setIsActive(true);
        productWithExpiredBatch = productRepository.save(productWithExpiredBatch);

        ProductBatch bUnexpired = new ProductBatch();
        bUnexpired.setProduct(productWithExpiredBatch);
        bUnexpired.setBatchNumber("B-VALID-01");
        bUnexpired.setQuantity(4);
        bUnexpired.setCostPrice(new BigDecimal("80.00"));
        bUnexpired.setExpiryDate(LocalDate.now().plusMonths(5));
        bUnexpired.setIsActive(true);
        batchRepository.save(bUnexpired);

        ProductBatch bExpired = new ProductBatch();
        bExpired.setProduct(productWithExpiredBatch);
        bExpired.setBatchNumber("B-EXPIRED-01");
        bExpired.setQuantity(20);
        bExpired.setCostPrice(new BigDecimal("80.00"));
        bExpired.setExpiryDate(LocalDate.now().minusDays(10)); // EXPIRED!
        bExpired.setIsActive(true);
        batchRepository.save(bExpired);

        // Product with stock exactly 10 for customer cart tests
        productStock10 = createProductWithBatch("Cetirizine 10mg", "CET-010", 5, 10, LocalDate.now().plusMonths(12));
    }

    private Product createProductWithBatch(String name, String sku, int minReorder, int qty, LocalDate expiry) {
        Product p = new Product();
        p.setName(name);
        p.setSku(sku);
        p.setUnit("Box");
        p.setSellingPrice(new BigDecimal("150.00"));
        p.setRequiresPrescription(false);
        p.setMinReorderLevel(minReorder);
        p.setIsActive(true);
        p = productRepository.save(p);

        ProductBatch b = new ProductBatch();
        b.setProduct(p);
        b.setBatchNumber("B-" + sku + "-01");
        b.setQuantity(qty);
        b.setCostPrice(new BigDecimal("100.00"));
        b.setExpiryDate(expiry);
        b.setIsActive(true);
        batchRepository.save(b);

        return p;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. DASHBOARD LOW-STOCK TESTS
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Admin dashboard low-stock query returns only products at or below threshold")
    void testAdminDashboardLowStockThresholds() throws Exception {
        MvcResult res = mockMvc.perform(get("/api/inventory/products/low-stock")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        String body = res.getResponse().getContentAsString();
        List<?> items = objectMapper.readValue(body, List.class);

        // Should contain productAtThreshold (stock 10), productBelowThreshold (stock 3), and productWithExpiredBatch (stock 4)
        // Should NOT contain productAboveThreshold (stock 25)
        assertThat(items).hasSize(3);

        mockMvc.perform(get("/api/inventory/products/low-stock")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].sku", not(hasItem("AMX-500"))))
                .andExpect(jsonPath("$[*].sku", hasItem("PCM-500")))
                .andExpect(jsonPath("$[*].sku", hasItem("INS-100")))
                .andExpect(jsonPath("$[*].sku", hasItem("OMP-020")));
    }

    @Test
    @DisplayName("Inventory Manager dashboard receives identical low-stock inventory data as Admin")
    void testInventoryManagerDashboardLowStock() throws Exception {
        mockMvc.perform(get("/api/inventory/products/low-stock")
                        .header("Authorization", "Bearer " + inventoryManagerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].sku", not(hasItem("AMX-500"))))
                .andExpect(jsonPath("$[*].sku", hasItem("PCM-500")))
                .andExpect(jsonPath("$[*].sku", hasItem("INS-100")))
                .andExpect(jsonPath("$[*].sku", hasItem("OMP-020")));
    }

    @Test
    @DisplayName("Product with expired batches excludes expired stock in low-stock computation")
    void testProductExcludesExpiredBatchesFromStock() throws Exception {
        // Omeprazole has 20 expired + 4 unexpired = total batches 24.
        // Authoritative stock MUST be 4.
        mockMvc.perform(get("/api/inventory/products/" + productWithExpiredBatch.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStock", is(4)));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. CUSTOMER STOCK & CART LIMIT TESTS
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Customer views product and sees correct available stock")
    void testCustomerViewsProductAvailableStock() throws Exception {
        mockMvc.perform(get("/api/inventory/products/" + productStock10.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStock", is(10)));
    }

    @Test
    @DisplayName("Customer adding quantity 5 to cart is allowed")
    void testAddQuantity5Allowed() throws Exception {
        CartItemRequest req = new CartItemRequest(productStock10.getId(), 5);

        mockMvc.perform(post("/api/cart/" + testCustomer.getId() + "/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity", is(5)))
                .andExpect(jsonPath("$.items[0].availableStock", is(10)));
    }

    @Test
    @DisplayName("Customer adding quantity 10 total to cart is allowed, but adding 11 is rejected")
    void testAddQuantityUpToLimitAndExceedingLimit() throws Exception {
        // Step 1: Add 5
        CartItemRequest req5 = new CartItemRequest(productStock10.getId(), 5);
        mockMvc.perform(post("/api/cart/" + testCustomer.getId() + "/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req5)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity", is(5)));

        // Step 2: Add another 5 (total 10 == available 10) -> Allowed
        mockMvc.perform(post("/api/cart/" + testCustomer.getId() + "/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req5)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity", is(10)));

        // Step 3: Add 1 more (total 11 > available 10) -> REJECTED (400 Bad Request)
        CartItemRequest req1 = new CartItemRequest(productStock10.getId(), 1);
        mockMvc.perform(post("/api/cart/" + testCustomer.getId() + "/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("available")));
    }

    @Test
    @DisplayName("Direct API request adding 11 units when only 10 available is rejected")
    void testDirectApiOversellRejected() throws Exception {
        CartItemRequest req11 = new CartItemRequest(productStock10.getId(), 11);
        mockMvc.perform(post("/api/cart/" + testCustomer.getId() + "/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req11)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("available")));
    }

    @Test
    @DisplayName("Updating cart item quantity beyond available stock is rejected")
    void testUpdateCartQuantityExceedingStockRejected() throws Exception {
        // Add 5 items
        CartItemRequest req5 = new CartItemRequest(productStock10.getId(), 5);
        MvcResult addRes = mockMvc.perform(post("/api/cart/" + testCustomer.getId() + "/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req5)))
                .andExpect(status().isOk())
                .andReturn();

        Integer itemId = objectMapper.readTree(addRes.getResponse().getContentAsString())
                .get("items").get(0).get("id").asInt();

        // Update to 10 (allowed)
        mockMvc.perform(put("/api/cart/" + testCustomer.getId() + "/items/" + itemId)
                        .header("Authorization", "Bearer " + customerToken)
                        .param("quantity", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].quantity", is(10)));

        // Update to 11 (rejected)
        mockMvc.perform(put("/api/cart/" + testCustomer.getId() + "/items/" + itemId)
                        .header("Authorization", "Bearer " + customerToken)
                        .param("quantity", "11"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("available")));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. CHECKOUT STOCK VALIDATION & NON-NEGATIVITY
    // ─────────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Checkout with insufficient stock is rejected safely and stock cannot become negative")
    void testCheckoutInsufficientStockRejected() throws Exception {
        // Direct order request with 15 units of productStock10 (available: 10)
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setDeliveryAddress("123 Main St, Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setItems(List.of(new CartItemRequest(productStock10.getId(), 15)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Insufficient stock")));

        // Verify stock in database remains exactly 10 and has NOT become negative
        List<ProductBatch> batches = batchRepository.findByProductId(productStock10.getId());
        int totalQty = batches.stream().mapToInt(ProductBatch::getQuantity).sum();
        assertThat(totalQty).isEqualTo(10);
        assertThat(batches.get(0).getQuantity()).isGreaterThanOrEqualTo(0);
    }

    @Test
    @DisplayName("Successful checkout deducts stock safely without becoming negative")
    void testSuccessfulCheckoutDeductsStock() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setDeliveryAddress("123 Main St, Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setItems(List.of(new CartItemRequest(productStock10.getId(), 6)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated());

        // Verify remaining stock is 4
        List<ProductBatch> batches = batchRepository.findByProductId(productStock10.getId());
        int totalQty = batches.stream().mapToInt(ProductBatch::getQuantity).sum();
        assertThat(totalQty).isEqualTo(4);
        assertThat(totalQty).isGreaterThanOrEqualTo(0);
    }
}
