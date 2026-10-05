# DEPENDENCIES.md -- Member 02 -- Inventory Management

## 1. Files Owned by This Member
See `FILES.txt` and `OWNERSHIP.md` for the complete list.

## 2. Shared Infrastructure Required
All files listed in `../SHARED-FILES.md` are required. Key ones:

| File | Purpose |
|------|---------|
| `auth/config/SecurityConfig.java` | HTTP security, CORS, JWT filter |
| `auth/security/JwtAuthenticationFilter.java` | Request authentication |
| `auth/entity/User.java` | Base user entity referenced by many modules |
| `common/exception/GlobalExceptionHandler.java` | Handles all thrown exceptions |
| `common/exception/BusinessException.java` | Thrown by service layer |
| `common/exception/ResourceNotFoundException.java` | Thrown on 404 lookups |
| `common/service/NotificationService.java` | Creates notifications |
| `common/service/FileStorageService.java` | File upload support |
| `frontend/src/services/api.js` | Axios base client |
| `frontend/src/context/AuthContext.jsx` | Auth state |
| `frontend/src/context/ToastContext.jsx` | Toast messages |

## 3. Cross-Module Communication
- **Member 01 (Online Order):** Online order deduction triggers stock movement via ProductService.deductStock().
- **Member 03 (Sales/Billing):** POS sale creation deducts stock via ProductService.deductStock().
- **Member 04 (Supplier):** Receiving purchase orders calls ProductService to add stock batches.

## 4. Database Dependencies
This module owns the tables listed in `OWNERSHIP.md`.
It also reads from:
- `users` and `roles` (SHARED/Auth) -- for authentication
- `products` and `product_batches` (Member 02) -- for product lookups
- `promotions` and `promotion_usage` (Member 05) -- for discount lookups

## 5. Files Requiring Team Coordination Before Changing
- `backend/src/main/java/com/pharmacy/auth/config/SecurityConfig.java`
- `backend/src/main/java/com/pharmacy/common/exception/GlobalExceptionHandler.java`
- `backend/src/main/java/com/pharmacy/PharmacyBackendApplication.java`
- `frontend/src/App.jsx`
- `frontend/src/components/layout/Sidebar.jsx`
- `database/schema.sql`
- `database/seed.sql`
- Any file under `frontend/src/components/common/`
- Any file under `frontend/src/components/layout/`
