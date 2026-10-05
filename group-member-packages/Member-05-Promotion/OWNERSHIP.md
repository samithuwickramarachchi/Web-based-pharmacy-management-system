# OWNERSHIP.md -- Member 05 -- Discount and Promotion Management

## Member Number
**Member 05**

## Function
**Promotion creation, coupon codes, discount logic, promotion-product relationships, usage tracking, and discount strategy pattern.**

## Branch
`feature/promotion-management`

---

## Backend Owned Files
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/controller/PromotionController.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/dto/CouponValidateRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/dto/CouponValidateResponse.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/dto/PromotionDto.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/dto/PromotionRequest.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/entity/DiscountType.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/entity/Promotion.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/entity/PromotionUsage.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/repository/PromotionRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/repository/PromotionUsageRepository.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/service/PromotionService.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/strategy/DiscountContext.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/strategy/DiscountStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/strategy/FixedAmountDiscountStrategy.java`
  - `backend/pharmacy-backend/src/main/java/com/pharmacy/promotion/strategy/PercentageDiscountStrategy.java`

---

## Frontend Owned Files
  - `frontend/src/pages/promotions/PromotionManagement.jsx`
  - `frontend/src/services/promotionService.js`

---

## Test Files
  - None (covered by shared integration tests)

---

## Database Tables
  - `promotions`
  - `promotion_products`
  - `promotion_usage`

---

## Design Patterns
Strategy Pattern (DiscountStrategy -- Percentage and Fixed Amount discount strategies via DiscountContext)

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
