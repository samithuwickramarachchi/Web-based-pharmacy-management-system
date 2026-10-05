# OWNERSHIP.md -- Member 01 -- Customer Management + Online Order Management

## Member Number
**Member 01**

## Function
**Customer registration, profiles, addresses, loyalty/membership, support messages, shopping cart, online orders, prescriptions, and order status management.**

## Branch
`feature/customer-online-order`

---

## Backend Owned Files
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/controller/CustomerController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/controller/SupportMessageController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/dto/AddressRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/dto/AddressResponse.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/dto/ChangePasswordRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/dto/CustomerDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/dto/CustomerUpdateRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/dto/SupportMessageRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/dto/SupportMessageResponse.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/dto/SupportReplyRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/entity/Customer.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/entity/CustomerAddress.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/entity/SupportMessage.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/repository/CustomerAddressRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/repository/CustomerRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/repository/SupportMessageRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/security/CustomerSecurity.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/service/CustomerService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/service/SupportMessageService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/strategy/loyalty/GoldLoyaltyTierStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/strategy/loyalty/LoyaltyTierContext.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/strategy/loyalty/LoyaltyTierStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/strategy/loyalty/SilverLoyaltyTierStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/customer/strategy/loyalty/StandardLoyaltyTierStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/controller/OnlineOrderController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/controller/ShoppingCartController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/controller/PrescriptionController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/CartItemDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/CartItemRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/CartResponse.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/OnlineOrderCreateRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/OnlineOrderItemDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/OnlineOrderResponse.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/OnlineOrderStatusUpdateRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/PrescriptionResponse.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/dto/PrescriptionStatusUpdateRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/CartItem.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/OnlineOrder.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/OnlineOrderItem.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/OrderStatus.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/Prescription.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/PrescriptionStatus.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/entity/ShoppingCart.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/repository/CartItemRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/repository/OnlineOrderItemRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/repository/OnlineOrderRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/repository/PrescriptionRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/repository/ShoppingCartRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/service/OnlineOrderService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/service/PrescriptionService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/sales/service/ShoppingCartService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/dto/CustomerRegisterRequest.java`

---

## Frontend Owned Files
  - `frontend/src/pages/customer/CartPage.jsx`
  - `frontend/src/pages/customer/CheckoutPage.jsx`
  - `frontend/src/pages/customer/CustomerAccount.jsx`
  - `frontend/src/pages/customer/CustomerHome.jsx`
  - `frontend/src/pages/customer/ProductCatalog.jsx`
  - `frontend/src/pages/customer/ProductDetails.jsx`
  - `frontend/src/pages/customers/CustomerList.jsx`
  - `frontend/src/pages/customers/CustomerOrders.jsx`
  - `frontend/src/services/customerService.js`
  - `frontend/src/services/salesService.js`
  - `frontend/src/context/CartContext.jsx`

---

## Test Files
  - `backend/pharmacy-backend/src/test/java/com/pharmacy/customer/CustomerPhase1IntegrationTest.java`
  - `backend/pharmacy-backend/src/test/java/com/pharmacy/customer/CustomerPhase4IntegrationTest.java`
  - `backend/pharmacy-backend/src/test/java/com/pharmacy/customer/CustomerDeletionIntegrationTest.java`
  - `backend/pharmacy-backend/src/test/java/com/pharmacy/sales/CustomerPhase2IntegrationTest.java`
  - `backend/pharmacy-backend/src/test/java/com/pharmacy/sales/CustomerPhase3IntegrationTest.java`
  - `backend/pharmacy-backend/src/test/java/com/pharmacy/sales/OrderFulfillmentIntegrationTest.java`

---

## Database Tables
  - `customers`
  - `customer_addresses`
  - `support_messages`
  - `shopping_carts`
  - `cart_items`
  - `online_orders`
  - `online_order_items`
  - `prescriptions`

---

## Design Patterns
Strategy Pattern (LoyaltyTierStrategy -- Standard / Silver / Gold loyalty tiers)

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
