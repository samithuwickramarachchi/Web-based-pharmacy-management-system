# database/

This directory contains all database-related files for the Web-Based Pharmacy Management System.

---

## Contents

| File | Description |
|---|---|
| `DATABASE_DESIGN.md` | Stage 3 approved relational design — all tables, columns, constraints, and relationships |
| `schema.sql` | MySQL 8 DDL — creates all 28 tables with keys, indexes, and constraints |

> `seed/` and `migrations/` directories will be added in later stages.

---

## How to Create the Database

### Prerequisites
- MySQL 8.0.16 or higher (CHECK constraints require 8.0.16+)
- MySQL client (`mysql`) installed and accessible from the command line

### Step 1 — Log in to MySQL

```bash
mysql -u root -p
```

### Step 2 — Create the database

```sql
CREATE DATABASE pharmacy_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

### Step 3 — Select the database

```sql
USE pharmacy_db;
```

### Step 4 — Run the schema

```bash
mysql -u root -p pharmacy_db < database/schema.sql
```

Or from inside the MySQL shell:

```sql
SOURCE /full/path/to/database/schema.sql;
```

### Step 5 — Verify

```sql
USE pharmacy_db;
SHOW TABLES;
```

You should see 28 tables listed.

---

## Table Overview

| # | Table | Purpose |
|---|---|---|
| 1 | `roles` | System roles (ADMIN, SALES_OFFICER, etc.) — pre-populated |
| 2 | `users` | All user accounts — staff and customers |
| 3 | `customers` | Customer profile data (one-to-one extension of users) |
| 4 | `customer_addresses` | Saved delivery addresses per customer |
| 5 | `categories` | Product/medicine categories with parent-child hierarchy |
| 6 | `manufacturers` | Medicine manufacturers |
| 7 | `products` | Master product catalogue |
| 8 | `product_batches` | Stock batches with expiry date and quantity tracking |
| 9 | `stock_movements` | Immutable audit trail of all stock changes |
| 10 | `suppliers` | Pharmacy suppliers |
| 11 | `purchase_orders` | Restock orders placed to suppliers |
| 12 | `purchase_order_items` | Line items in purchase orders |
| 13 | `promotions` | Discount campaigns and coupon codes |
| 14 | `promotion_products` | Products eligible for a specific promotion |
| 15 | `sales` | In-store sales transaction headers |
| 16 | `sale_items` | Line items in in-store sales (price snapshotted) |
| 17 | `sale_payments` | Payment records for in-store sales |
| 18 | `shopping_carts` | Active online cart — one per customer |
| 19 | `cart_items` | Products in active shopping carts |
| 20 | `online_orders` | Orders placed through the online portal |
| 21 | `online_order_items` | Line items in online orders (price snapshotted) |
| 22 | `prescriptions` | Customer-uploaded prescriptions linked to online orders |
| 23 | `payments` | Payment records for online orders |
| 24 | `promotion_usage` | Tracks promotion use — enforces per-customer and total limits |
| 25 | `deliveries` | Delivery records for confirmed online orders |
| 26 | `delivery_status_history` | Append-only log of delivery status changes |
| 27 | `activity_logs` | System-wide audit trail of significant actions |
| 28 | `notifications` | In-application notifications for staff and customers |

---

## Spring Boot `application.properties` Connection

Once MySQL is running, update the backend configuration:

```properties
# backend/pharmacy-backend/src/main/resources/application.properties

spring.datasource.url=jdbc:mysql://localhost:3306/pharmacy_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```

> **Important:** Use `ddl-auto=validate` in production to prevent Hibernate from modifying the manually managed schema.

---

## Notes

- All monetary values use `DECIMAL` — no floating-point types.
- Prices in `sale_items` and `online_order_items` are **snapshotted at transaction time** and are independent of the current `products.selling_price`.
- The `roles` table is pre-populated by `schema.sql` with the 8 system roles.
- No sample users, passwords, or API keys are stored in any SQL file.
- GPS tracking, email, and SMS features are **out of scope** — not present in the schema.
