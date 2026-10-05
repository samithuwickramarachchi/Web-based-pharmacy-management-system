package com.pharmacy.sales;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmacy.auth.dto.CustomerRegisterRequest;
import com.pharmacy.auth.dto.LoginRequest;
import com.pharmacy.auth.entity.Role;
import com.pharmacy.auth.entity.User;
import com.pharmacy.auth.repository.RoleRepository;
import com.pharmacy.auth.repository.UserRepository;
import com.pharmacy.common.entity.ActivityLog;
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
import com.pharmacy.sales.dto.PaymentReviewRequest;
import com.pharmacy.sales.dto.PrescriptionStatusUpdateRequest;
import com.pharmacy.sales.entity.*;
import com.pharmacy.sales.repository.OnlineOrderRepository;
import com.pharmacy.sales.repository.PaymentRepository;
import com.pharmacy.sales.repository.PrescriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:order_phase3_testdb;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.upload.dir=target/test-uploads"
})
public class CustomerPhase3IntegrationTest {

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
    private PaymentRepository paymentRepository;

    @Autowired
    private PrescriptionRepository prescriptionRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private String customer1Token;
    private Customer customer1;

    private String customer2Token;
    private Customer customer2;

    private String staffToken;

    private Product normalProduct;
    private Product rxProduct;

    private static final byte[] VALID_PDF_BYTES = ("%PDF-1.4\n1 0 obj\n<<\n>>\nendobj\ntrailer\n<<\n>>\n%%EOF").getBytes(StandardCharsets.UTF_8);
    private static final byte[] VALID_JPG_BYTES = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00};
    private static final byte[] VALID_PNG_BYTES = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};

    @BeforeEach
    void setUp() throws Exception {
        stockMovementRepository.deleteAll();
        prescriptionRepository.deleteAll();
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        batchRepository.deleteAll();
        productRepository.deleteAll();
        activityLogRepository.deleteAll();
        customerAddressRepository.deleteAll();
        customerRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role customerRole = roleRepository.save(new Role("CUSTOMER", "Customer"));
        Role adminRole = roleRepository.save(new Role("ADMIN", "Admin"));
        Role salesStaffRole = roleRepository.save(new Role("SALES_STAFF", "Sales Staff"));

        // Register Customer 1
        CustomerRegisterRequest reg1 = new CustomerRegisterRequest(
                "Nimal Perera", "nimal@pharmacy.com", "0771111111", "Colombo", "Password123"
        );
        MvcResult res1 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg1)))
                .andExpect(status().isCreated())
                .andReturn();
        customer1Token = objectMapper.readTree(res1.getResponse().getContentAsString()).get("accessToken").asText();
        customer1 = customerRepository.findByUserId(userRepository.findByEmail("nimal@pharmacy.com").orElseThrow().getId()).orElseThrow();

        // Register Customer 2
        CustomerRegisterRequest reg2 = new CustomerRegisterRequest(
                "Kamal Silva", "kamal@pharmacy.com", "0772222222", "Kandy", "Password123"
        );
        MvcResult res2 = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg2)))
                .andExpect(status().isCreated())
                .andReturn();
        customer2Token = objectMapper.readTree(res2.getResponse().getContentAsString()).get("accessToken").asText();
        customer2 = customerRepository.findByUserId(userRepository.findByEmail("kamal@pharmacy.com").orElseThrow().getId()).orElseThrow();

        // Create Staff User
        User staff = new User();
        staff.setUsername("staff_john");
        staff.setEmail("staff@pharmacy.com");
        staff.setPasswordHash(passwordEncoder.encode("StaffPass123"));
        staff.setRole(salesStaffRole);
        staff.setIsActive(true);
        userRepository.save(staff);

        // Login as Staff
        LoginRequest staffLogin = new LoginRequest();
        staffLogin.setUsernameOrEmail("staff_john");
        staffLogin.setPassword("StaffPass123");
        MvcResult staffRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staffLogin)))
                .andExpect(status().isOk())
                .andReturn();
        staffToken = objectMapper.readTree(staffRes.getResponse().getContentAsString()).get("accessToken").asText();

        // Normal Product
        normalProduct = new Product();
        normalProduct.setName("Paracetamol 500mg");
        normalProduct.setSku("PARA-500");
        normalProduct.setUnit("Box");
        normalProduct.setSellingPrice(new BigDecimal("250.00"));
        normalProduct.setRequiresPrescription(false);
        normalProduct.setIsActive(true);
        normalProduct = productRepository.save(normalProduct);

        ProductBatch b1 = new ProductBatch();
        b1.setProduct(normalProduct);
        b1.setBatchNumber("B-PARA-01");
        b1.setQuantity(50);
        b1.setCostPrice(new BigDecimal("180.00"));
        b1.setExpiryDate(LocalDate.now().plusMonths(6));
        b1.setIsActive(true);
        batchRepository.save(b1);

        // Rx Product
        rxProduct = new Product();
        rxProduct.setName("Amoxicillin 500mg");
        rxProduct.setSku("AMOX-500");
        rxProduct.setUnit("Strips");
        rxProduct.setSellingPrice(new BigDecimal("450.00"));
        rxProduct.setRequiresPrescription(true);
        rxProduct.setIsActive(true);
        rxProduct = productRepository.save(rxProduct);

        ProductBatch b2 = new ProductBatch();
        b2.setProduct(rxProduct);
        b2.setBatchNumber("B-AMOX-01");
        b2.setQuantity(30);
        b2.setCostPrice(new BigDecimal("300.00"));
        b2.setExpiryDate(LocalDate.now().plusMonths(8));
        b2.setIsActive(true);
        batchRepository.save(b2);
    }

    // ─── 1. Valid PDF prescription upload ────────────────────────────────────────

    @Test
    void test1_ValidPdfPrescriptionUpload() throws Exception {
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "doctor_prescription.pdf", "application/pdf", VALID_PDF_BYTES
        );

        mockMvc.perform(multipart("/api/prescriptions/upload")
                        .file(pdfFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filePath").isNotEmpty())
                .andExpect(jsonPath("$.originalFilename").value("doctor_prescription.pdf"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    // ─── 2. Valid JPG/JPEG prescription upload ───────────────────────────────────

    @Test
    void test2_ValidJpgPrescriptionUpload() throws Exception {
        MockMultipartFile jpgFile = new MockMultipartFile(
                "file", "script_photo.jpg", "image/jpeg", VALID_JPG_BYTES
        );

        mockMvc.perform(multipart("/api/prescriptions/upload")
                        .file(jpgFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filePath").isNotEmpty())
                .andExpect(jsonPath("$.originalFilename").value("script_photo.jpg"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    // ─── 3. Valid PNG prescription upload ────────────────────────────────────────

    @Test
    void test3_ValidPngPrescriptionUpload() throws Exception {
        MockMultipartFile pngFile = new MockMultipartFile(
                "file", "rx_scan.png", "image/png", VALID_PNG_BYTES
        );

        mockMvc.perform(multipart("/api/prescriptions/upload")
                        .file(pngFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filePath").isNotEmpty())
                .andExpect(jsonPath("$.originalFilename").value("rx_scan.png"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    // ─── 4. File >5 MB rejected ──────────────────────────────────────────────────

    @Test
    void test4_PrescriptionFileOver5Mb_Rejected() throws Exception {
        byte[] oversized = new byte[5 * 1024 * 1024 + 1024]; // 5 MB + 1 KB
        System.arraycopy(VALID_PDF_BYTES, 0, oversized, 0, VALID_PDF_BYTES.length);

        MockMultipartFile largeFile = new MockMultipartFile(
                "file", "oversized_rx.pdf", "application/pdf", oversized
        );

        mockMvc.perform(multipart("/api/prescriptions/upload")
                        .file(largeFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("exceeds maximum allowed size of 5 MB")));
    }

    // ─── 5. Unsupported file rejected ───────────────────────────────────────────

    @Test
    void test5_UnsupportedFile_Rejected() throws Exception {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file", "malicious_script.exe", "application/x-msdownload", new byte[]{0x4D, 0x5A, 0x00, 0x00}
        );

        mockMvc.perform(multipart("/api/prescriptions/upload")
                        .file(exeFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Unsupported file type")));
    }

    // ─── 6. Valid transaction slip upload ───────────────────────────────────────

    @Test
    void test6_ValidTransactionSlipUpload() throws Exception {
        // Place order with BANK_CARD_TRANSACTION
        OnlineOrderCreateRequest req = new OnlineOrderCreateRequest();
        req.setCustomerId(customer1.getId());
        req.setDeliveryAddress("Colombo");
        req.setFulfillmentType("DELIVERY");
        req.setPaymentMethod(PaymentMethod.BANK_CARD_TRANSACTION);
        req.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 2)));

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        // Upload bank transaction slip
        MockMultipartFile slipFile = new MockMultipartFile(
                "file", "bank_transfer_slip.png", "image/png", VALID_PNG_BYTES
        );

        mockMvc.perform(multipart("/api/orders/" + orderId + "/payment-slip")
                        .file(slipFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentMethod").value("BANK_CARD_TRANSACTION"))
                .andExpect(jsonPath("$.transactionReference").isNotEmpty())
                .andExpect(jsonPath("$.paymentGateway").value("BANK_CARD_SLIP"))
                .andExpect(jsonPath("$.status").value("PENDING"));

        Payment payment = paymentRepository.findByOnlineOrderId(orderId).orElseThrow();
        assertThat(payment.getTransactionReference()).contains("slips/");
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PENDING);
    }

    // ─── 7. Transaction slip >5 MB rejected ─────────────────────────────────────

    @Test
    void test7_TransactionSlipOver5Mb_Rejected() throws Exception {
        OnlineOrderCreateRequest req = new OnlineOrderCreateRequest();
        req.setCustomerId(customer1.getId());
        req.setDeliveryAddress("Colombo");
        req.setFulfillmentType("DELIVERY");
        req.setPaymentMethod(PaymentMethod.BANK_CARD_TRANSACTION);
        req.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 1)));

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        byte[] oversized = new byte[5 * 1024 * 1024 + 2048];
        System.arraycopy(VALID_PNG_BYTES, 0, oversized, 0, VALID_PNG_BYTES.length);

        MockMultipartFile largeSlip = new MockMultipartFile(
                "file", "huge_slip.png", "image/png", oversized
        );

        mockMvc.perform(multipart("/api/orders/" + orderId + "/payment-slip")
                        .file(largeSlip)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("exceeds maximum allowed size of 5 MB")));

        // Unsupported file (.exe) for slip upload rejected
        MockMultipartFile exeSlip = new MockMultipartFile(
                "file", "receipt.exe", "application/x-msdownload", new byte[]{0x4D, 0x5A, 0x00, 0x00}
        );
        mockMvc.perform(multipart("/api/orders/" + orderId + "/payment-slip")
                        .file(exeSlip)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Unsupported file type")));
    }

    // ─── 8. Customer cannot access another customer's file ──────────────────────

    @Test
    void test8_CustomerCannotAccessAnotherCustomerFile() throws Exception {
        // Customer 1 places order and uploads slip
        OnlineOrderCreateRequest req = new OnlineOrderCreateRequest();
        req.setCustomerId(customer1.getId());
        req.setDeliveryAddress("Colombo");
        req.setFulfillmentType("DELIVERY");
        req.setPaymentMethod(PaymentMethod.BANK_CARD_TRANSACTION);
        req.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 1)));

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        MockMultipartFile slipFile = new MockMultipartFile("file", "slip1.pdf", "application/pdf", VALID_PDF_BYTES);
        mockMvc.perform(multipart("/api/orders/" + orderId + "/payment-slip")
                        .file(slipFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isCreated());

        // Customer 1 (owner) can access own payment slip
        MvcResult ownerRes = mockMvc.perform(get("/api/orders/" + orderId + "/payment-slip")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("application/pdf")))
                .andReturn();
        assertThat(ownerRes.getResponse().getContentAsByteArray()).isEqualTo(VALID_PDF_BYTES);

        // Customer 2 attempts to view Customer 1's slip and is rejected
        mockMvc.perform(get("/api/orders/" + orderId + "/payment-slip")
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isForbidden());

        // Verify unauthorized access was logged in ActivityLog
        List<ActivityLog> logs = activityLogRepository.findAll();
        assertThat(logs).anyMatch(l -> "UNAUTHORIZED_PAYMENT_SLIP_ACCESS".equals(l.getAction()));
    }

    // ─── 9. Authorized staff can view prescription ──────────────────────────────

    @Test
    void test9_AuthorizedStaffCanViewPrescription() throws Exception {
        // Upload prescription for customer 1
        MockMultipartFile pdfFile = new MockMultipartFile("file", "dr_rx.pdf", "application/pdf", VALID_PDF_BYTES);
        MvcResult uploadRes = mockMvc.perform(multipart("/api/prescriptions/upload")
                        .file(pdfFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isCreated())
                .andReturn();
        String storedPath = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("filePath").asText();

        // Place Rx order linking this prescription
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(customer1.getId());
        orderReq.setDeliveryAddress("Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(rxProduct.getId(), 2)));
        orderReq.setPrescriptionFilePath(storedPath);
        orderReq.setPrescriptionOriginalFilename("dr_rx.pdf");

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Integer prescriptionId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("prescription").get("id").asInt();

        // Customer 1 (owner) can view own prescription file
        MvcResult ownerRes = mockMvc.perform(get("/api/prescriptions/" + prescriptionId + "/file")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("application/pdf")))
                .andReturn();
        assertThat(ownerRes.getResponse().getContentAsByteArray()).isEqualTo(VALID_PDF_BYTES);

        // Customer 2 (unauthorized) cannot view Customer 1's prescription file
        mockMvc.perform(get("/api/prescriptions/" + prescriptionId + "/file")
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isForbidden());

        // Staff views prescription file
        MvcResult fileRes = mockMvc.perform(get("/api/prescriptions/" + prescriptionId + "/file")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("application/pdf")))
                .andReturn();

        assertThat(fileRes.getResponse().getContentAsByteArray()).isEqualTo(VALID_PDF_BYTES);
    }

    // ─── 10. Authorized staff can view transaction slip ─────────────────────────

    @Test
    void test10_AuthorizedStaffCanViewTransactionSlip() throws Exception {
        OnlineOrderCreateRequest req = new OnlineOrderCreateRequest();
        req.setCustomerId(customer1.getId());
        req.setDeliveryAddress("Colombo");
        req.setFulfillmentType("DELIVERY");
        req.setPaymentMethod(PaymentMethod.BANK_CARD_TRANSACTION);
        req.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 1)));

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        MockMultipartFile slipFile = new MockMultipartFile("file", "slip.png", "image/png", VALID_PNG_BYTES);
        mockMvc.perform(multipart("/api/orders/" + orderId + "/payment-slip")
                        .file(slipFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isCreated());

        // Staff views the slip
        MvcResult fileRes = mockMvc.perform(get("/api/orders/" + orderId + "/payment-slip")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", org.hamcrest.Matchers.containsString("image/png")))
                .andReturn();

        assertThat(fileRes.getResponse().getContentAsByteArray()).isEqualTo(VALID_PNG_BYTES);
    }

    // ─── 11. Prescription approval ──────────────────────────────────────────────

    @Test
    void test11_PrescriptionApproval() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(customer1.getId());
        orderReq.setDeliveryAddress("Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(rxProduct.getId(), 2)));
        orderReq.setPrescriptionFilePath("prescriptions/temp_test.pdf");
        orderReq.setPrescriptionOriginalFilename("temp.pdf");

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();
        Integer prescriptionId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("prescription").get("id").asInt();

        // Staff approves prescription
        PrescriptionStatusUpdateRequest reviewReq = new PrescriptionStatusUpdateRequest();
        reviewReq.setStatus(PrescriptionStatus.APPROVED);
        reviewReq.setReviewNotes("Prescription verified with Dr. Silva");

        mockMvc.perform(patch("/api/prescriptions/" + prescriptionId + "/review")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.reviewedByName").value("staff_john"));

        // Order status should cascade to CONFIRMED for COD
        OnlineOrder updatedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    // ─── 12. Prescription rejection ─────────────────────────────────────────────

    @Test
    void test12_PrescriptionRejection() throws Exception {
        OnlineOrderCreateRequest orderReq = new OnlineOrderCreateRequest();
        orderReq.setCustomerId(customer1.getId());
        orderReq.setDeliveryAddress("Colombo");
        orderReq.setFulfillmentType("DELIVERY");
        orderReq.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        orderReq.setItems(Collections.singletonList(new CartItemRequest(rxProduct.getId(), 1)));
        orderReq.setPrescriptionFilePath("prescriptions/temp_rej.pdf");
        orderReq.setPrescriptionOriginalFilename("temp_rej.pdf");

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();
        Integer prescriptionId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("prescription").get("id").asInt();

        // Staff rejects prescription
        PrescriptionStatusUpdateRequest reviewReq = new PrescriptionStatusUpdateRequest();
        reviewReq.setStatus(PrescriptionStatus.REJECTED);
        reviewReq.setReviewNotes("Expired prescription date");

        mockMvc.perform(patch("/api/prescriptions/" + prescriptionId + "/review")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        // Order status should cascade to CANCELLED
        OnlineOrder updatedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.CANCELLED);
    }

    // ─── 13. Transaction approval ───────────────────────────────────────────────

    @Test
    void test13_TransactionApproval() throws Exception {
        OnlineOrderCreateRequest req = new OnlineOrderCreateRequest();
        req.setCustomerId(customer1.getId());
        req.setDeliveryAddress("Colombo");
        req.setFulfillmentType("DELIVERY");
        req.setPaymentMethod(PaymentMethod.BANK_CARD_TRANSACTION);
        req.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 2)));

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        // Upload slip
        MockMultipartFile slipFile = new MockMultipartFile("file", "slip.jpg", "image/jpeg", VALID_JPG_BYTES);
        mockMvc.perform(multipart("/api/orders/" + orderId + "/payment-slip")
                        .file(slipFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isCreated());

        // Staff approves payment
        PaymentReviewRequest reviewReq = new PaymentReviewRequest(PaymentStatus.COMPLETED, null);
        mockMvc.perform(patch("/api/orders/" + orderId + "/payment/review")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // Order status transitions to CONFIRMED
        OnlineOrder updatedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    // ─── 14. Transaction rejection ──────────────────────────────────────────────

    @Test
    void test14_TransactionRejection() throws Exception {
        OnlineOrderCreateRequest req = new OnlineOrderCreateRequest();
        req.setCustomerId(customer1.getId());
        req.setDeliveryAddress("Colombo");
        req.setFulfillmentType("DELIVERY");
        req.setPaymentMethod(PaymentMethod.BANK_CARD_TRANSACTION);
        req.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 1)));

        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();
        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        // Upload slip
        MockMultipartFile slipFile = new MockMultipartFile("file", "bad_slip.png", "image/png", VALID_PNG_BYTES);
        mockMvc.perform(multipart("/api/orders/" + orderId + "/payment-slip")
                        .file(slipFile)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isCreated());

        // Staff rejects payment
        PaymentReviewRequest reviewReq = new PaymentReviewRequest(PaymentStatus.FAILED, "Transfer reference not recognized in bank account");
        mockMvc.perform(patch("/api/orders/" + orderId + "/payment/review")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FAILED"));

        // Order status transitions to PAYMENT_FAILED
        OnlineOrder updatedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(updatedOrder.getStatus()).isEqualTo(OrderStatus.PAYMENT_FAILED);
    }

    // ─── 15. COD workflow still works ───────────────────────────────────────────

    @Test
    void test15_CodWorkflowStillWorks() throws Exception {
        OnlineOrderCreateRequest req = new OnlineOrderCreateRequest();
        req.setCustomerId(customer1.getId());
        req.setDeliveryAddress("Colombo 07");
        req.setFulfillmentType("DELIVERY");
        req.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        req.setItems(Collections.singletonList(new CartItemRequest(normalProduct.getId(), 4)));

        // Place COD order
        MvcResult orderRes = mockMvc.perform(post("/api/orders")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.payment.paymentMethod").value("CASH_ON_DELIVERY"))
                .andExpect(jsonPath("$.payment.status").value("PENDING"))
                .andReturn();

        Integer orderId = objectMapper.readTree(orderRes.getResponse().getContentAsString()).get("id").asInt();

        // Staff can update COD order directly to CONFIRMED without requiring payment slip
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"CONFIRMED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // Then progress to PROCESSING -> READY_FOR_DELIVERY
        mockMvc.perform(patch("/api/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\": \"PROCESSING\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PROCESSING"));
    }
}
