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
import com.pharmacy.inventory.entity.Product;
import com.pharmacy.inventory.entity.ProductBatch;
import com.pharmacy.inventory.entity.StockMovement;
import com.pharmacy.inventory.entity.StockMovementType;
import com.pharmacy.inventory.repository.ProductBatchRepository;
import com.pharmacy.inventory.repository.ProductRepository;
import com.pharmacy.inventory.repository.StockMovementRepository;
import com.pharmacy.sales.dto.CartItemRequest;
import com.pharmacy.sales.dto.OnlineOrderCreateRequest;
import com.pharmacy.sales.entity.OrderStatus;
import com.pharmacy.sales.entity.PaymentMethod;
import com.pharmacy.sales.entity.PrescriptionStatus;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import com.pharmacy.sales.repository.PrescriptionRepository;
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
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:order_phase2_testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class CustomerPhase2IntegrationTest {

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
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String customerToken;
    private Customer testCustomer;
    private Product normalProduct;
    private Product rxProduct;
    private Product outOfStockProduct;

    @BeforeEach
    void setUp() throws Exception {
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

        roleRepository.save(new Role("CUSTOMER", "Customer"));
        roleRepository.save(new Role("ADMIN", "Admin"));

        // Register customer
        CustomerRegisterRequest reg = new CustomerRegisterRequest(
                "Nimal Perera",
                "nimal@pharmacy.com",
                "0771122334",
                "100 Main Street, Colombo",
                "Password123"
        );
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn();

        customerToken = objectMapper.readTree(regRes.getResponse().getContentAsString()).get("accessToken").asText();
        testCustomer = customerRepository.findByUserId(
                userRepository.findByEmail("nimal@pharmacy.com").orElseThrow().getId()
        ).orElseThrow();

        // 1. Create Normal Product with 2 batches (total stock = 50: batch1=20, batch2=30)
        normalProduct = new Product();
        normalProduct.setName("Paracetamol 500mg");
        normalProduct.setSku("PARA-500");
        normalProduct.setUnit("Box");
        normalProduct.setSellingPrice(new BigDecimal("250.00"));
        normalProduct.setRequiresPrescription(false);
        normalProduct.setMinReorderLevel(10);
        normalProduct.setIsActive(true);
        normalProduct = productRepository.save(normalProduct);

        ProductBatch b1 = new ProductBatch();
        b1.setProduct(normalProduct);
        b1.setBatchNumber("BATCH-PARA-01");
        b1.setQuantity(20);
        b1.setCostPrice(new BigDecimal("180.00"));
        b1.setExpiryDate(LocalDate.now().plusMonths(6));
        b1.setIsActive(true);
        batchRepository.save(b1);

        ProductBatch b2 = new ProductBatch();
        b2.setProduct(normalProduct);
        b2.setBatchNumber("BATCH-PARA-02");
        b2.setQuantity(30);
        b2.setCostPrice(new BigDecimal("180.00"));
        b2.setExpiryDate(LocalDate.now().plusMonths(12));
        b2.setIsActive(true);
        batchRepository.save(b2);

        // 2. Create Prescription-Required Product with stock 25
        rxProduct = new Product();
        rxProduct.setName("Amoxicillin 500mg");
        rxProduct.setSku("AMOX-500");
        rxProduct.setUnit("Strips");
        rxProduct.setSellingPrice(new BigDecimal("450.00"));
        rxProduct.setRequiresPrescription(true);
        rxProduct.setMinReorderLevel(5);
        rxProduct.setIsActive(true);
        rxProduct = productRepository.save(rxProduct);

        ProductBatch rxBatch = new ProductBatch();
        rxBatch.setProduct(rxProduct);
        rxBatch.setBatchNumber("BATCH-AMOX-01");
        rxBatch.setQuantity(25);
        rxBatch.setCostPrice(new BigDecimal("300.00"));
        rxBatch.setExpiryDate(LocalDate.now().plusMonths(8));
        rxBatch.setIsActive(true);
        batchRepository.save(rxBatch);

        // 3. Create Out of Stock Product (quantity = 0)
        outOfStockProduct = new Product();
        outOfStockProduct.setName("Vitamin C 1000mg");
        outOfStockProduct.setSku("VITC-1000");
        outOfStockProduct.setUnit("Bottle");
        outOfStockProduct.setSellingPrice(new BigDecimal("800.00"));
        outOfStockProduct.setRequiresPrescription(false);
        outOfStockProduct.setMinReorderLevel(5);
        outOfStockProduct.setIsActive(true);
        outOfStockProduct = productRepository.save(outOfStockProduct);

        ProductBatch zeroBatch = new ProductBatch();
        zeroBatch.setProduct(outOfStockProduct);
        zeroBatch.setBatchNumber("BATCH-VITC-01");
        zeroBatch.setQuantity(0);
        zeroBatch.setCostPrice(new BigDecimal("500.00"));
        zeroBatch.setExpiryDate(LocalDate.now().plusMonths(10));
        zeroBatch.setIsActive(true);
        batchRepository.save(zeroBatch);
    }

    // ─── 1. Successful Checkout & Stock Deduction ────────────────────────────────

    @Test
    void testSuccessfulCheckout_DeductsStockCorrectly() throws Exception {
        // Initial stock = 20 (batch1) + 30 (batch2) = 50
        int initialStock = batchRepository.findByProductIdAndIsActiveTrue(normalProduct.getId())
                .stream().mapToInt(ProductBatch::getQuantity).sum();
        assertThat(initialStock).isEqualTo(50);

        // Order 25 units: should deplete batch 1 (20) and take 5 from batch 2
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setDeliveryAddress("100 Main Street, Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 25)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.totalAmount").value(6250.00)); // 25 * 250.00

        // Verify remaining stock = 50 - 25 = 25
        int updatedStock = batchRepository.findByProductIdAndIsActiveTrue(normalProduct.getId())
                .stream().mapToInt(ProductBatch::getQuantity).sum();
        assertThat(updatedStock).isEqualTo(25);

        // Verify batch 1 depleted to 0 and batch 2 reduced to 25 (FEFO)
        ProductBatch b1 = batchRepository.findByProductIdAndBatchNumber(normalProduct.getId(), "BATCH-PARA-01").orElseThrow();
        ProductBatch b2 = batchRepository.findByProductIdAndBatchNumber(normalProduct.getId(), "BATCH-PARA-02").orElseThrow();
        assertThat(b1.getQuantity()).isEqualTo(0);
        assertThat(b2.getQuantity()).isEqualTo(25);

        // Verify stock movements recorded
        List<StockMovement> movements = stockMovementRepository.findAll();
        assertThat(movements).hasSize(2);
        assertThat(movements.get(0).getMovementType()).isEqualTo(StockMovementType.ONLINE_SALE_OUT);
    }

    // ─── 2. Insufficient Stock Rejection ─────────────────────────────────────────

    @Test
    void testInsufficientStock_RejectsOrder_DoesNotDeductStock() throws Exception {
        // Stock is 50. Request 60 units.
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setDeliveryAddress("100 Main Street, Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 60)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Insufficient stock")));

        // Verify stock remains untouched at 50
        int stockAfter = batchRepository.findByProductIdAndIsActiveTrue(normalProduct.getId())
                .stream().mapToInt(ProductBatch::getQuantity).sum();
        assertThat(stockAfter).isEqualTo(50);

        // Verify no orders were persisted
        assertThat(orderRepository.count()).isEqualTo(0);
        assertThat(stockMovementRepository.count()).isEqualTo(0);
    }

    // ─── 3. Out-Of-Stock Rejection ───────────────────────────────────────────────

    @Test
    void testOutOfStockProduct_RejectsOrder() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setDeliveryAddress("100 Main Street, Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(outOfStockProduct.getId(), 2)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Product " + outOfStockProduct.getName() + " is out of stock"));

        assertThat(orderRepository.count()).isEqualTo(0);
    }

    // ─── 4. Missing Prescription Rejection ───────────────────────────────────────

    @Test
    void testPrescriptionRequiredProduct_MissingPrescription_RejectsOrder() throws Exception {
        // Amoxicillin requires prescription. Do not provide prescriptionFilePath.
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setDeliveryAddress("100 Main Street, Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(rxProduct.getId(), 2)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Prescription is required")));

        // Verify stock is untouched
        int rxStock = batchRepository.findByProductIdAndIsActiveTrue(rxProduct.getId())
                .stream().mapToInt(ProductBatch::getQuantity).sum();
        assertThat(rxStock).isEqualTo(25);
        assertThat(orderRepository.count()).isEqualTo(0);
    }

    // ─── 5. Successful Prescription-Required Order ───────────────────────────────

    @Test
    void testPrescriptionRequiredProduct_WithPrescription_Success() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setDeliveryAddress("100 Main Street, Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(rxProduct.getId(), 5)));
        orderReq.setPrescriptionFilePath("/uploads/prescriptions/presc_doc_01.jpg");
        orderReq.setPrescriptionOriginalFilename("dr_perera_prescription.jpg");

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.status").value(OrderStatus.AWAITING_PRESCRIPTION.name()))
                .andExpect(jsonPath("$.requiresPrescription").value(true))
                .andExpect(jsonPath("$.prescription").isNotEmpty())
                .andExpect(jsonPath("$.prescription.filePath").value("/uploads/prescriptions/presc_doc_01.jpg"))
                .andExpect(jsonPath("$.prescription.status").value(PrescriptionStatus.PENDING.name()));

        // Verify stock was deducted: 25 - 5 = 20
        int rxStock = batchRepository.findByProductIdAndIsActiveTrue(rxProduct.getId())
                .stream().mapToInt(ProductBatch::getQuantity).sum();
        assertThat(rxStock).isEqualTo(20);
    }

    // ─── 6. Cart Validation & Price Integrity ────────────────────────────────────

    @Test
    void testZeroQuantityItem_FailsValidation() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(testCustomer.getId());
        orderReq.setDeliveryAddress("100 Main Street, Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 0)));

        mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Item quantity must be greater than zero"));
    }
}
