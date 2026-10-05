# PharmaCare Pro -- Web-Based Pharmacy Management System

> **Initial Project Skeleton** -- Team Structure Repository

This repository contains the **project structure only**. It is the starting point for a 6-member team. Each member will implement their assigned module on their own Git branch.

---

## Team Members and Module Assignments

| Branch               | Module       | Responsibility                                              |
|----------------------|--------------|-------------------------------------------------------------|
| feature/customer     | Customer     | Customer registration, profile, online ordering, cart       |
| feature/delivery     | Delivery     | Delivery assignment, tracking, status management            |
| feature/inventory    | Inventory    | Products, stock, batches, categories, manufacturers         |
| feature/promotion    | Promotion    | Promotions, discount coupons, offers                        |
| feature/sales        | Sales        | Sales terminal, billing, prescriptions, shopping cart       |
| feature/supplier     | Supplier     | Supplier management, purchase orders, stock receiving       |

---

## Project Structure

```
Web-based-pharmacy-management-system/
|
+-- backend/
|   +-- pharmacy-backend/
|       +-- pom.xml                        <- Maven build config
|       +-- mvnw.cmd                       <- Maven wrapper
|       +-- src/main/java/com/pharmacy/
|           +-- PharmacyBackendApplication.java
|           +-- auth/                      <- Shared: JWT auth, security
|           +-- common/                    <- Shared: exceptions, DTOs, utilities
|           +-- customer/                  <- Reserved: Member 1
|           +-- delivery/                  <- Reserved: Member 2
|           +-- inventory/                 <- Reserved: Member 3
|           +-- promotion/                 <- Reserved: Member 4
|           +-- sales/                     <- Reserved: Member 5
|           +-- supplier/                  <- Reserved: Member 6
|
+-- frontend/
|   +-- package.json
|   +-- vite.config.js
|   +-- src/
|       +-- main.jsx
|       +-- App.jsx
|       +-- components/common/             <- Shared UI components
|       +-- components/layout/             <- Shared layout
|       +-- pages/
|       |   +-- Dashboard.jsx
|       |   +-- Login.jsx
|       |   +-- Register.jsx
|       |   +-- customer/                  <- Reserved: Member 1
|       |   +-- deliveries/                <- Reserved: Member 2
|       |   +-- inventory/                 <- Reserved: Member 3
|       |   +-- promotions/                <- Reserved: Member 4
|       |   +-- sales/                     <- Reserved: Member 5
|       |   +-- suppliers/                 <- Reserved: Member 6
|       +-- services/                      <- Each member adds their service
|       +-- context/                       <- Shared state/context
|       +-- styles/                        <- Shared CSS
|       +-- utils/                         <- Shared utilities
|
+-- database/
|   +-- schema.sql
|   +-- DATABASE_DESIGN.md
|   +-- README.md
|   +-- migrations/
|
+-- docs/
+-- .gitignore
+-- README.md
```

---

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Maven 3.8+

### Backend Setup
```bash
cd backend/pharmacy-backend
# Set environment variables (do NOT hardcode secrets)
# Windows:
set DB_PASSWORD=your_mysql_password
set JWT_SECRET=your_jwt_secret_key
./mvnw spring-boot:run
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Setup
```bash
mysql -u root -p < database/schema.sql
```

---

## Branch Workflow

```
main  (project structure only -- do not push feature code here)
  |
  +-- feature/customer
  +-- feature/delivery
  +-- feature/inventory
  +-- feature/promotion
  +-- feature/sales
  +-- feature/supplier
```

### Each Team Member Should

```bash
# 1. Clone the repository
git clone https://github.com/samithuwickramarachchi/Web-based-pharmacy-management-system.git
cd Web-based-pharmacy-management-system

# 2. Checkout your feature branch
git checkout feature/customer   # replace with your branch

# 3. Add your implementation to your module folder
# Backend: backend/pharmacy-backend/src/main/java/com/pharmacy/customer/
# Frontend: frontend/src/pages/customer/

# 4. Commit and push
git add .
git commit -m "feat(customer): add customer module implementation"
git push origin feature/customer
```

---

## Important Rules

- Do NOT push implementation code to main
- Do NOT push to another members feature branch
- Do NOT commit .env files or secrets
- Only push to your assigned feature branch
- Keep node_modules/ and target/ out of Git (gitignored)

---

## Tech Stack

| Layer    | Technology                                 |
|----------|--------------------------------------------|
| Backend  | Java 17, Spring Boot 3, Spring Security, JWT |
| Frontend | React 18, Vite, Vanilla CSS                |
| Database | MySQL 8.0                                  |
| Build    | Maven (backend), npm (frontend)            |

---

## Shared Modules (Already Implemented)

The following shared infrastructure must NOT be modified without team coordination:

- auth/       -- JWT authentication, Spring Security configuration
- common/     -- Global exception handling, shared DTOs, notification service
- components/common/  -- Reusable UI components (Button, Modal, Card, etc.)
- components/layout/  -- App layout, sidebar, header, routing guards
