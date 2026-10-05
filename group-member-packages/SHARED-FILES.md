# SHARED-FILES.md -- PharmaCare Pro Pharmacy Management System

## Purpose
These files are used by **multiple members** and must not be modified independently.
Any change to a shared file requires team coordination and a dedicated PR reviewed by all affected members.

---

## Shared Files

| File Path | What It Does | Why Coordinate |
|-----------|-------------|----------------|
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/config/SecurityConfig.java` | Spring Security configuration. Defines HTTP security, CORS, JWT filter chain, role-based access. All members depend on this. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/controller/AuthController.java` | Handles /auth/login and /auth/register. Required by every member to authenticate before accessing APIs. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/dto/AuthResponse.java` | JWT token response DTO returned on login. Used by frontend auth for all members. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/dto/LoginRequest.java` | Login request DTO. Shared by all members' frontend login flow. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/dto/UserProfileResponse.java` | Authenticated user profile DTO. Used across frontend for all members. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/entity/Role.java` | Role entity (ADMIN, CUSTOMER, SALES_OFFICER, etc.). Referenced by User entity and security config across all modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/entity/User.java` | Core User entity. All staff and customer accounts. Referenced by Customer, Sale, Delivery, PurchaseOrder, Promotion, ActivityLog. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/repository/RoleRepository.java` | JPA repository for Role. Used by SecurityConfig and user registration. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/repository/UserRepository.java` | JPA repository for User. Used by auth, customer, delivery, supplier, and sales modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/security/CustomAccessDeniedHandler.java` | Returns 403 JSON for unauthorized access. Shared security infrastructure. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/security/CustomUserDetails.java` | Wraps User entity for Spring Security. Used by all modules verifying authenticated principals. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/security/CustomUserDetailsService.java` | Loads UserDetails by username. Core security dependency for all modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/security/JwtAuthenticationEntryPoint.java` | Returns 401 JSON on missing/invalid token. Shared security infrastructure. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/security/JwtAuthenticationFilter.java` | Intercepts every HTTP request to validate JWT. All API endpoints depend on this filter. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/auth/security/JwtTokenProvider.java` | Generates and validates JWT tokens. Shared authentication infrastructure. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/config/DatabaseConnectionValidator.java` | Validates DB connection on startup. Shared infrastructure for all modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/controller/NotificationController.java` | REST endpoints for in-app notifications. Used by inventory (low stock) and customer (order) notifications. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/dto/ApiError.java` | Standardized error response DTO. Used by GlobalExceptionHandler for all modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/dto/NotificationDto.java` | Notification data transfer object. Shared by notification controller and frontend. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/entity/ActivityLog.java` | Audit log entity. Records significant actions across all modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/entity/Notification.java` | In-app notification entity. Created by inventory observer and order service. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/exception/BusinessException.java` | Application-level exception. Thrown and handled across all modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/exception/DuplicateResourceException.java` | 409 Conflict exception. Used by customer, inventory, supplier, and promotion modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/exception/GlobalExceptionHandler.java` | @ControllerAdvice that catches all exceptions from all modules and returns structured JSON errors. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/exception/ResourceNotFoundException.java` | 404 Not Found exception. Used by all modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/repository/ActivityLogRepository.java` | JPA repository for ActivityLog. Used by ActivityLogService called from multiple modules. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/repository/NotificationRepository.java` | JPA repository for Notification. Used by NotificationService and inventory observers. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/service/ActivityLogService.java` | Records audit entries. Called by customer, sales, inventory, and delivery services. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/service/FileStorageService.java` | Handles file uploads for prescriptions and proof of delivery. Shared by Members 01 and 06. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/common/service/NotificationService.java` | Creates in-app notifications. Called by inventory observer, online order service, and delivery service. | All members depend on this |
| `backend/pharmacy-backend/src/main/java/com/pharmacy/PharmacyBackendApplication.java` | Spring Boot application entry point. Shared bootstrap -- no member should modify independently. | All members depend on this |
| `frontend/src/services/api.js` | Axios instance with JWT interceptor. Base API client used by all frontend service files. | All members depend on this |
| `frontend/src/services/authService.js` | Login, register, and profile API calls. Used by all members' frontend for authentication. | All members depend on this |
| `frontend/src/services/notificationService.js` | Fetches in-app notifications. Used by the Header component shared across all staff pages. | All members depend on this |
| `frontend/src/context/AuthContext.jsx` | React auth context. Provides user state to all frontend pages and components. | All members depend on this |
| `frontend/src/context/ToastContext.jsx` | Toast notification context. Used by all frontend pages for success/error messages. | All members depend on this |
| `frontend/src/App.jsx` | React Router root with all routes. Every member's pages are registered here. | All members depend on this |
| `frontend/src/App.css` | Global application CSS. Shared by all frontend components. | All members depend on this |
| `frontend/src/index.css` | Root CSS file. Shared global styles. | All members depend on this |
| `frontend/src/main.jsx` | React application bootstrap. Shared entry point. | All members depend on this |
| `frontend/src/components/layout/AppLayout.jsx` | Staff admin layout with sidebar and header. Used by Sales, Inventory, Supplier, Promotion, and Delivery pages. | All members depend on this |
| `frontend/src/components/layout/Sidebar.jsx` | Staff navigation sidebar. Lists all module links -- shared by all staff members. | All members depend on this |
| `frontend/src/components/layout/Header.jsx` | Staff top header with notifications and user menu. Shared by all staff pages. | All members depend on this |
| `frontend/src/components/layout/ProtectedRoute.jsx` | Role-based route guard. Shared by all protected pages. | All members depend on this |
| `frontend/src/components/layout/CustomerLayout.jsx` | Customer storefront layout. Shared by all customer-facing pages. | All members depend on this |
| `frontend/src/components/layout/CustomerNavbar.jsx` | Customer navigation bar. Shared customer layout component. | All members depend on this |
| `frontend/src/components/layout/CustomerFooter.jsx` | Customer footer. Shared customer layout component. | All members depend on this |
| `frontend/src/components/layout/NotificationPanel.jsx` | Notification dropdown. Shared by Header for all staff members. | All members depend on this |
| `frontend/src/components/common/Badge.jsx` | Status badge component. Used across multiple modules. | All members depend on this |
| `frontend/src/components/common/Button.jsx` | Shared button component. Used across all pages. | All members depend on this |
| `frontend/src/components/common/Card.jsx` | Card container component. Used across all pages. | All members depend on this |
| `frontend/src/components/common/ConfirmModal.jsx` | Confirmation dialog. Used by inventory, supplier, customer, and promotion pages. | All members depend on this |
| `frontend/src/components/common/EmptyState.jsx` | Empty state placeholder. Used across all pages. | All members depend on this |
| `frontend/src/components/common/Input.jsx` | Shared input component. Used across all pages. | All members depend on this |
| `frontend/src/components/common/LoadingSpinner.jsx` | Loading indicator. Used across all pages. | All members depend on this |
| `frontend/src/components/common/Modal.jsx` | Base modal dialog. Used by all pages. | All members depend on this |
| `frontend/src/components/common/Pagination.jsx` | Pagination component. Used by inventory, customer, and online order pages. | All members depend on this |
| `frontend/src/styles/auth.css` | Auth page styles (login/register). Shared authentication UI. | All members depend on this |
| `frontend/src/styles/components.css` | Shared UI component styles (buttons, badges, cards, tables). Used by all pages. | All members depend on this |
| `frontend/src/styles/customer.css` | Customer storefront styles. Shared by all customer pages. | All members depend on this |
| `frontend/src/styles/dashboard.css` | Dashboard/admin styles. Shared by all staff pages. | All members depend on this |
| `frontend/src/styles/index.css` | Global CSS variables and resets. Foundation for all page styles. | All members depend on this |
| `frontend/src/styles/layout.css` | Layout grid and sidebar styles. Shared by all staff pages. | All members depend on this |
| `frontend/src/utils/formatUtils.js` | Currency and date formatters. Used across all frontend pages. | All members depend on this |
| `frontend/src/utils/productImageUtil.js` | Product image URL builder. Used by inventory, customer, and sales pages. | All members depend on this |
| `frontend/src/utils/roleUtils.js` | Role-checking utilities. Used by protected routes and component visibility logic. | All members depend on this |
| `frontend/src/pages/Dashboard.jsx` | Main staff dashboard with summary stats. References all modules. | All members depend on this |
| `frontend/src/pages/Login.jsx` | Login page. Shared by all members. | All members depend on this |
| `frontend/src/pages/Register.jsx` | Customer self-registration page. Shared auth flow. | All members depend on this |
| `frontend/src/pages/NotFound.jsx` | 404 page. Shared route fallback. | All members depend on this |
| `frontend/src/pages/PlaceholderModule.jsx` | Placeholder for unimplemented modules. Shared infrastructure. | All members depend on this |
| `database/schema.sql` | MySQL database schema defining all tables. Shared by all members -- no member should change independently. | All members depend on this |
| `database/seed.sql` | Initial seed data. Shared setup data for the full application. | All members depend on this |
| `database/DATABASE_DESIGN.md` | Database design documentation. Shared reference for all members. | All members depend on this |
| `database/README.md` | Database README. Shared setup instructions. | All members depend on this |
| `database/migrations/v4_customer_loyalty_support.sql` | Migration: customer loyalty and support messages. | All members depend on this |
| `database/migrations/v5_support_message_reply.sql` | Migration: support message staff reply. | All members depend on this |
| `database/migrations/v6_order_fulfillment_type.sql` | Migration: order fulfillment_type column. | All members depend on this |

---

## Rules
1. Never modify a shared file on a feature branch without creating a separate PR.
2. Shared PRs must be reviewed by all affected members.
3. Database schema changes require unanimous team approval.
4. Auth/security changes require the team lead to review.
