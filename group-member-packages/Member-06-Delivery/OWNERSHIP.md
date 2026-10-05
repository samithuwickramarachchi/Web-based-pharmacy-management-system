# OWNERSHIP.md -- Member 06 -- Delivery Management

## Member Number
**Member 06**

## Function
**Delivery creation and assignment, delivery tracking, delivery status transitions, delivery status history, and delivery staff workflows.**

## Branch
`feature/delivery-management`

---

## Backend Owned Files
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/controller/DeliveryController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/dto/DeliveryAssignRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/dto/DeliveryDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/dto/DeliveryStatusHistoryDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/dto/DeliveryStatusUpdateRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/entity/Delivery.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/entity/DeliveryStatus.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/entity/DeliveryStatusHistory.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/repository/DeliveryRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/repository/DeliveryStatusHistoryRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/service/DeliveryService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/state/DeliveredDeliveryState.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/state/DeliveryContext.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/state/DeliveryState.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/state/FailedDeliveryState.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/state/OutForDeliveryState.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/delivery/state/PendingDeliveryState.java`

---

## Frontend Owned Files
  - `frontend/src/pages/deliveries/DeliveryManagement.jsx`
  - `frontend/src/services/deliveryService.js`

---

## Test Files
  - None (covered by shared integration tests)

---

## Database Tables
  - `deliveries`
  - `delivery_status_history`

---

## Design Patterns
State Pattern (DeliveryState -- Pending, OutForDelivery, Delivered, Failed states via DeliveryContext)

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
