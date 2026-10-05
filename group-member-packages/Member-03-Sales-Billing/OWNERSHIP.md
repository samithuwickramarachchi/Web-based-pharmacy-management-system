# OWNERSHIP.md -- Member 03 -- Sales and Billing Management

## Member Number
**Member 03**

## Function
**In-store POS sales, payment processing, payment review, payment status, billing/invoice logic, and the payment strategy pattern.**

## Branch
`feature/sales-billing`

---

## Backend Owned Files
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/controller/PaymentController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/PaymentDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/PaymentReviewRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/Payment.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/PaymentMethod.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/PaymentMethodConverter.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/PaymentStatus.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/repository/PaymentRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/service/PaymentService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/controller/SaleController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/SaleItemRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/SaleRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/SaleResponse.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/Sale.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/SaleItem.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/SalePayment.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/SalePaymentMethod.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/repository/SaleItemRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/repository/SalePaymentRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/repository/SaleRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/service/SaleService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/billing/AbstractOrderBillingProcessor.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/billing/OnlineOrderBillingProcessor.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/billing/OrderBillingSummary.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/billing/PosSaleBillingProcessor.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/strategy/payment/BankTransferPaymentStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/strategy/payment/CardPaymentStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/strategy/payment/CashOnDeliveryPaymentStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/strategy/payment/CashPaymentStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/strategy/payment/PaymentProcessingContext.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/strategy/payment/PaymentProcessResult.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/strategy/payment/PaymentStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/strategy/payment/PaymentStrategyProcessor.java`

---

## Frontend Owned Files
  - `frontend/src/pages/sales/SalesTerminal.jsx`
  - `frontend/src/pages/sales/OnlineOrders.jsx`
  - `frontend/src/services/salesService.js`

---

## Test Files
  - None (covered by shared integration tests)

---

## Database Tables
  - `sales`
  - `sale_items`
  - `sale_payments`
  - `payments`

---

## Design Patterns
Strategy Pattern (PaymentStrategy -- Cash, Card, CashOnDelivery, BankTransfer) | Template Method (AbstractOrderBillingProcessor -- Online and POS billing processors)

---

## Shared Dependencies
All members share:
- `auth/` -- Security, JWT, User, Role
- `common/` -- Exceptions, Notifications, ActivityLog, FileStorage
- Frontend: `api.js`, `AuthContext.jsx`, `ToastContext.jsx`, layout components, common UI components, all CSS files

See `../SHARED-FILES.md` for the complete list.

---

## Files NOT To Modify Without Team Coordination
- `auth/config/SecurityConfig.java` -- affects all route security
- `common/exception/GlobalExceptionHandler.java` -- affects all error responses
- `frontend/src/App.jsx` -- affects all routing
- `database/schema.sql` -- affects all members
- Any `common/` infrastructure file
- Any shared layout or context file
