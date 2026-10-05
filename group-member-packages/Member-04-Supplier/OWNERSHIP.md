# OWNERSHIP.md -- Member 04 -- Supplier Management

## Member Number
**Member 04**

## Function
**Supplier registration, purchase order creation and tracking, stock receiving workflow, and procurement management.**

## Branch
`feature/supplier-management`

---

## Backend Owned Files
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/controller/PurchaseOrderController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/controller/SupplierController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/dto/PurchaseOrderDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/dto/PurchaseOrderItemDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/dto/PurchaseOrderItemRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/dto/PurchaseOrderRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/dto/ReceiveStockItemRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/dto/ReceiveStockRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/dto/SupplierDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/dto/SupplierRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/entity/PurchaseOrder.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/entity/PurchaseOrderItem.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/entity/PurchaseOrderStatus.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/entity/Supplier.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/factory/BulkPurchaseOrderFactory.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/factory/PurchaseOrderFactory.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/factory/PurchaseOrderFactoryProvider.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/factory/StandardPurchaseOrderFactory.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/factory/UrgentPurchaseOrderFactory.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/repository/PurchaseOrderItemRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/repository/PurchaseOrderRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/repository/SupplierRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/service/PurchaseOrderService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/supplier/service/SupplierService.java`

---

## Frontend Owned Files
  - `frontend/src/pages/suppliers/SupplierManagement.jsx`
  - `frontend/src/services/supplierService.js`

---

## Test Files
  - None (covered by shared integration tests)

---

## Database Tables
  - `suppliers`
  - `purchase_orders`
  - `purchase_order_items`

---

## Design Patterns
Factory Method Pattern (PurchaseOrderFactory -- Standard, Bulk, Urgent order factories via PurchaseOrderFactoryProvider)

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
