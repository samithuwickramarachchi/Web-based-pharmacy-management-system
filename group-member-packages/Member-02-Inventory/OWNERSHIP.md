# OWNERSHIP.md -- Member 02 -- Inventory Management

## Member Number
**Member 02**

## Function
**Product catalogue, category management, manufacturer management, stock batches, stock movements, low stock alerts, and FEFO stock deduction.**

## Branch
`feature/inventory-management`

---

## Backend Owned Files
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/controller/CategoryController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/controller/ManufacturerController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/controller/ProductController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/dto/CategoryDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/dto/CategoryRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/dto/ManufacturerDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/dto/ManufacturerRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/dto/ProductBatchDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/dto/ProductBatchRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/dto/ProductDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/dto/ProductRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/dto/StockAdjustmentRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/entity/Category.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/entity/Manufacturer.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/entity/Product.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/entity/ProductBatch.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/entity/StockMovement.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/entity/StockMovementType.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/observer/BatchExpiryAlertObserver.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/observer/LowStockAlertObserver.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/observer/StockEvent.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/observer/StockObserver.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/observer/StockSubject.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/repository/CategoryRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/repository/ManufacturerRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/repository/ProductBatchRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/repository/ProductRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/repository/StockMovementRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/service/CategoryService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/service/ManufacturerService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/inventory/service/ProductService.java`

---

## Frontend Owned Files
  - `frontend/src/pages/inventory/InventoryManagement.jsx`
  - `frontend/src/services/inventoryService.js`

---

## Test Files
  - `backend/pharmacy-backend/src/test/java/com/pharmacy/inventory/InventoryStockIntegrationTest.java`

---

## Database Tables
  - `categories`
  - `manufacturers`
  - `products`
  - `product_batches`
  - `stock_movements`

---

## Design Patterns
Observer Pattern (StockSubject / StockObserver -- LowStockAlertObserver, BatchExpiryAlertObserver)

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
