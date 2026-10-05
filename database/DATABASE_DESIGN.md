# Database Design — Web-Based Pharmacy Management System

**Database:** MySQL 8  
**Design Stage:** Stage 3 (Design only — no SQL or Java code yet)

---

## 1. Table Index

| # | Table | Area |
|---|---|---|
| 1 | `roles` | User & Role Management |
| 2 | `users` | User & Role Management |
| 3 | `customers` | Customer Management |
| 4 | `customer_addresses` | Customer Management |
| 5 | `categories` | Product / Inventory |
| 6 | `manufacturers` | Product / Inventory |
| 7 | `products` | Product / Inventory |
| 8 | `product_batches` | Product / Inventory |
| 9 | `stock_movements` | Product / Inventory |
| 10 | `suppliers` | Suppliers / Procurement |
| 11 | `purchase_orders` | Suppliers / Procurement |
| 12 | `purchase_order_items` | Suppliers / Procurement |
| 13 | `sales` | In-Store Sales & Billing |
| 14 | `sale_items` | In-Store Sales & Billing |
| 15 | `sale_payments` | In-Store Sales & Billing |
| 16 | `shopping_carts` | Online Purchasing |
| 17 | `cart_items` | Online Purchasing |
| 18 | `online_orders` | Online Purchasing |
| 19 | `online_order_items` | Online Purchasing |
| 20 | `prescriptions` | Prescriptions |
| 21 | `payments` | Online Payments |
| 22 | `promotions` | Promotions |
| 23 | `promotion_products` | Promotions |
| 24 | `promotion_usage` | Promotions |
| 25 | `deliveries` | Delivery |
| 26 | `delivery_status_history` | Delivery |
| 27 | `activity_logs` | System Records |
| 28 | `notifications` | Notifications |

---

## 2. Relationships Overview

```
roles ──< users >── customers ──< customer_addresses
                       │
                       ├──< shopping_carts ──< cart_items >── products
                       │
                       └──< online_orders ──< online_order_items >── products
                                  │
                                  ├── prescriptions
                                  ├── payments
                                  └── deliveries ──< delivery_status_history

users ──< sales ──< sale_items >── products
              └──< sale_payments

suppliers ──< purchase_orders ──< purchase_order_items >── products

categories ──< products >── product_batches
manufacturers ──< products
product_batches ──< stock_movements

promotions ──< promotion_products >── products
promotions ──< promotion_usage

users ──< activity_logs
users ──< notifications
```

---

## 3. Table Definitions

---

### 3.1 `roles`
Defines the access roles available in the system.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `name` | `VARCHAR(50)` | NOT NULL, UNIQUE | — | e.g. `ADMIN`, `SALES_OFFICER` |
| `description` | `VARCHAR(255)` | NULL | NULL | Human-readable description |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Predefined roles:**
- `ADMIN`
- `SALES_OFFICER`
- `INVENTORY_MANAGER`
- `SUPPLIER_OFFICER`
- `PROMOTION_MANAGER`
- `DELIVERY_OFFICER`
- `CUSTOMER_MANAGER`
- `CUSTOMER`

---

### 3.2 `users`
All system accounts — both staff and customers. Customers get a `CUSTOMER` role entry here and a linked `customers` record.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `role_id` | `INT UNSIGNED` | FK → `roles.id`, NOT NULL | — | |
| `username` | `VARCHAR(50)` | NOT NULL, UNIQUE | — | Login identifier |
| `email` | `VARCHAR(150)` | NOT NULL, UNIQUE | — | |
| `password_hash` | `VARCHAR(255)` | NOT NULL | — | Bcrypt hash |
| `is_active` | `TINYINT(1)` | NOT NULL | `1` | 0 = disabled |
| `last_login_at` | `DATETIME` | NULL | NULL | |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `role_id` → `roles(id)`

---

### 3.3 `customers`
Extended profile information for customer-role users.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `user_id` | `INT UNSIGNED` | FK → `users.id`, NOT NULL, UNIQUE | — | One-to-one with users |
| `first_name` | `VARCHAR(80)` | NOT NULL | — | |
| `last_name` | `VARCHAR(80)` | NOT NULL | — | |
| `phone` | `VARCHAR(20)` | NULL | NULL | |
| `date_of_birth` | `DATE` | NULL | NULL | |
| `membership_id` | `VARCHAR(30)` | UNIQUE, NULL | NULL | Auto-generated membership number |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

---

### 3.4 `customer_addresses`
Delivery addresses saved by customers. A customer may have multiple saved addresses.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `customer_id` | `INT UNSIGNED` | FK → `customers.id`, NOT NULL | — | |
| `label` | `VARCHAR(50)` | NULL | NULL | e.g. `Home`, `Office` |
| `address_line1` | `VARCHAR(255)` | NOT NULL | — | |
| `address_line2` | `VARCHAR(255)` | NULL | NULL | |
| `city` | `VARCHAR(100)` | NOT NULL | — | |
| `postal_code` | `VARCHAR(20)` | NULL | NULL | |
| `is_default` | `TINYINT(1)` | NOT NULL | `0` | |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `customer_id` → `customers(id)` ON DELETE CASCADE

---

### 3.5 `categories`
Product categories. Supports one level of parent-child hierarchy.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `parent_id` | `INT UNSIGNED` | FK → `categories.id`, NULL | NULL | NULL = top-level |
| `name` | `VARCHAR(100)` | NOT NULL, UNIQUE | — | |
| `description` | `VARCHAR(255)` | NULL | NULL | |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `parent_id` → `categories(id)` ON DELETE SET NULL

---

### 3.6 `manufacturers`
Medicine and product manufacturers.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `name` | `VARCHAR(150)` | NOT NULL, UNIQUE | — | |
| `country` | `VARCHAR(100)` | NULL | NULL | |
| `contact_email` | `VARCHAR(150)` | NULL | NULL | |
| `contact_phone` | `VARCHAR(30)` | NULL | NULL | |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

---

### 3.7 `products`
Master product / medicine catalogue. Stock quantities are tracked at the batch level in `product_batches`.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `category_id` | `INT UNSIGNED` | FK → `categories.id`, NULL | NULL | |
| `manufacturer_id` | `INT UNSIGNED` | FK → `manufacturers.id`, NULL | NULL | |
| `name` | `VARCHAR(200)` | NOT NULL | — | |
| `sku` | `VARCHAR(60)` | NOT NULL, UNIQUE | — | Stock-keeping unit code |
| `description` | `TEXT` | NULL | NULL | |
| `dosage_info` | `VARCHAR(200)` | NULL | NULL | e.g. `500mg`, `10ml/5ml` |
| `unit` | `VARCHAR(30)` | NOT NULL | — | e.g. `tablet`, `bottle`, `strip` |
| `selling_price` | `DECIMAL(10,2)` | NOT NULL | — | Current retail price |
| `requires_prescription` | `TINYINT(1)` | NOT NULL | `0` | 1 = prescription mandatory |
| `min_reorder_level` | `INT UNSIGNED` | NOT NULL | `10` | Alert threshold |
| `is_active` | `TINYINT(1)` | NOT NULL | `1` | 0 = discontinued |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

**Constraints:**
- `CHECK (selling_price >= 0)`
- `CHECK (min_reorder_level >= 0)`

**Foreign Keys:**
- `category_id` → `categories(id)` ON DELETE SET NULL
- `manufacturer_id` → `manufacturers(id)` ON DELETE SET NULL

---

### 3.8 `product_batches`
Individual stock batches for each product. Tracks expiry dates and batch quantities.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `product_id` | `INT UNSIGNED` | FK → `products.id`, NOT NULL | — | |
| `batch_number` | `VARCHAR(80)` | NOT NULL | — | Manufacturer batch/lot number |
| `quantity` | `INT` | NOT NULL | — | Current quantity in this batch |
| `cost_price` | `DECIMAL(10,2)` | NOT NULL | — | Purchase cost per unit |
| `manufacture_date` | `DATE` | NULL | NULL | |
| `expiry_date` | `DATE` | NOT NULL | — | |
| `is_active` | `TINYINT(1)` | NOT NULL | `1` | 0 = expired / written off |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Constraints:**
- `UNIQUE (product_id, batch_number)`
- `CHECK (quantity >= 0)`
- `CHECK (cost_price >= 0)`

**Foreign Keys:**
- `product_id` → `products(id)` ON DELETE RESTRICT

> **Stock on hand for a product** = `SUM(quantity)` across all active, non-expired batches.

---

### 3.9 `stock_movements`
Audit trail of every stock quantity change — purchases, sales, adjustments, returns, expiry write-offs.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `product_id` | `INT UNSIGNED` | FK → `products.id`, NOT NULL | — | |
| `batch_id` | `INT UNSIGNED` | FK → `product_batches.id`, NULL | NULL | NULL for non-batch movements |
| `movement_type` | `ENUM(...)` | NOT NULL | — | See values below |
| `quantity_change` | `INT` | NOT NULL | — | Positive = stock in, Negative = stock out |
| `reference_type` | `VARCHAR(50)` | NULL | NULL | e.g. `SALE`, `ONLINE_ORDER`, `PURCHASE_ORDER` |
| `reference_id` | `INT UNSIGNED` | NULL | NULL | FK-like pointer to the source record |
| `notes` | `VARCHAR(255)` | NULL | NULL | |
| `performed_by` | `INT UNSIGNED` | FK → `users.id`, NULL | NULL | NULL for automated system movements |
| `performed_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**`movement_type` values:**
`PURCHASE_IN`, `SALE_OUT`, `ONLINE_SALE_OUT`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `RETURN_IN`, `EXPIRY_WRITEOFF`, `TRANSFER`

**Foreign Keys:**
- `product_id` → `products(id)` ON DELETE RESTRICT
- `batch_id` → `product_batches(id)` ON DELETE RESTRICT
- `performed_by` → `users(id)` ON DELETE SET NULL

---

### 3.10 `suppliers`
Registered suppliers who provide stock to the pharmacy.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `name` | `VARCHAR(150)` | NOT NULL, UNIQUE | — | |
| `contact_person` | `VARCHAR(100)` | NULL | NULL | |
| `phone` | `VARCHAR(30)` | NULL | NULL | |
| `email` | `VARCHAR(150)` | NULL | NULL | |
| `address` | `TEXT` | NULL | NULL | |
| `is_active` | `TINYINT(1)` | NOT NULL | `1` | |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

---

### 3.11 `purchase_orders`
Orders placed by the pharmacy to restock from suppliers.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `po_number` | `VARCHAR(30)` | NOT NULL, UNIQUE | — | e.g. `PO-2026-0001` |
| `supplier_id` | `INT UNSIGNED` | FK → `suppliers.id`, NOT NULL | — | |
| `ordered_by` | `INT UNSIGNED` | FK → `users.id`, NOT NULL | — | Staff who created the PO |
| `status` | `ENUM(...)` | NOT NULL | `'DRAFT'` | See values below |
| `order_date` | `DATE` | NOT NULL | — | |
| `expected_delivery_date` | `DATE` | NULL | NULL | |
| `received_date` | `DATE` | NULL | NULL | Actual receipt date |
| `total_amount` | `DECIMAL(12,2)` | NOT NULL | `0.00` | |
| `notes` | `TEXT` | NULL | NULL | |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

**`status` values:** `DRAFT`, `SUBMITTED`, `CONFIRMED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`

**Foreign Keys:**
- `supplier_id` → `suppliers(id)` ON DELETE RESTRICT
- `ordered_by` → `users(id)` ON DELETE RESTRICT

---

### 3.12 `purchase_order_items`
Line items for each purchase order.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `purchase_order_id` | `INT UNSIGNED` | FK → `purchase_orders.id`, NOT NULL | — | |
| `product_id` | `INT UNSIGNED` | FK → `products.id`, NOT NULL | — | |
| `quantity_ordered` | `INT UNSIGNED` | NOT NULL | — | |
| `quantity_received` | `INT UNSIGNED` | NOT NULL | `0` | Updated on receipt |
| `unit_cost` | `DECIMAL(10,2)` | NOT NULL | — | Agreed cost per unit |
| `total_cost` | `DECIMAL(12,2)` | NOT NULL | — | `quantity_ordered × unit_cost` |

**Constraints:**
- `UNIQUE (purchase_order_id, product_id)`
- `CHECK (quantity_ordered > 0)`
- `CHECK (quantity_received >= 0)`

**Foreign Keys:**
- `purchase_order_id` → `purchase_orders(id)` ON DELETE CASCADE
- `product_id` → `products(id)` ON DELETE RESTRICT

---

### 3.13 `sales`
In-store sales transaction header.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `sale_number` | `VARCHAR(30)` | NOT NULL, UNIQUE | — | e.g. `INV-2026-0001` |
| `customer_id` | `INT UNSIGNED` | FK → `customers.id`, NULL | NULL | NULL = walk-in customer |
| `staff_id` | `INT UNSIGNED` | FK → `users.id`, NOT NULL | — | Sales staff who processed it |
| `promotion_id` | `INT UNSIGNED` | FK → `promotions.id`, NULL | NULL | Applied promotion |
| `sale_date` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `subtotal` | `DECIMAL(12,2)` | NOT NULL | — | Before discounts |
| `discount_amount` | `DECIMAL(10,2)` | NOT NULL | `0.00` | |
| `tax_amount` | `DECIMAL(10,2)` | NOT NULL | `0.00` | |
| `total_amount` | `DECIMAL(12,2)` | NOT NULL | — | Final amount |
| `notes` | `VARCHAR(255)` | NULL | NULL | |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Constraints:**
- `CHECK (subtotal >= 0)`
- `CHECK (discount_amount >= 0)`
- `CHECK (total_amount >= 0)`

**Foreign Keys:**
- `customer_id` → `customers(id)` ON DELETE SET NULL
- `staff_id` → `users(id)` ON DELETE RESTRICT
- `promotion_id` → `promotions(id)` ON DELETE SET NULL

---

### 3.14 `sale_items`
Individual product lines within an in-store sale.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `sale_id` | `INT UNSIGNED` | FK → `sales.id`, NOT NULL | — | |
| `product_id` | `INT UNSIGNED` | FK → `products.id`, NOT NULL | — | |
| `batch_id` | `INT UNSIGNED` | FK → `product_batches.id`, NOT NULL | — | Which batch was sold |
| `quantity` | `INT UNSIGNED` | NOT NULL | — | |
| `unit_price` | `DECIMAL(10,2)` | NOT NULL | — | Price at time of sale |
| `discount_amount` | `DECIMAL(10,2)` | NOT NULL | `0.00` | Per-line discount |
| `total_price` | `DECIMAL(12,2)` | NOT NULL | — | `(unit_price × quantity) − discount` |

**Constraints:**
- `CHECK (quantity > 0)`
- `CHECK (unit_price >= 0)`

**Foreign Keys:**
- `sale_id` → `sales(id)` ON DELETE RESTRICT
- `product_id` → `products(id)` ON DELETE RESTRICT
- `batch_id` → `product_batches(id)` ON DELETE RESTRICT

---

### 3.15 `sale_payments`
Payment record(s) for an in-store sale. One sale can have one payment method.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `sale_id` | `INT UNSIGNED` | FK → `sales.id`, NOT NULL, UNIQUE | — | One payment per sale |
| `payment_method` | `ENUM('CASH','CARD','ONLINE_TRANSFER')` | NOT NULL | — | |
| `amount_paid` | `DECIMAL(12,2)` | NOT NULL | — | |
| `change_given` | `DECIMAL(10,2)` | NOT NULL | `0.00` | For cash payments |
| `reference_number` | `VARCHAR(100)` | NULL | NULL | Card/transfer ref |
| `paid_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `sale_id` → `sales(id)` ON DELETE RESTRICT

---

### 3.16 `shopping_carts`
Active shopping cart — one per customer at any time.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `customer_id` | `INT UNSIGNED` | FK → `customers.id`, NOT NULL, UNIQUE | — | One active cart per customer |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `customer_id` → `customers(id)` ON DELETE CASCADE

---

### 3.17 `cart_items`
Products added to a customer's active cart.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `cart_id` | `INT UNSIGNED` | FK → `shopping_carts.id`, NOT NULL | — | |
| `product_id` | `INT UNSIGNED` | FK → `products.id`, NOT NULL | — | |
| `quantity` | `INT UNSIGNED` | NOT NULL | — | |
| `added_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Constraints:**
- `UNIQUE (cart_id, product_id)` — one row per product per cart; update quantity instead of duplicate
- `CHECK (quantity > 0)`

**Foreign Keys:**
- `cart_id` → `shopping_carts(id)` ON DELETE CASCADE
- `product_id` → `products(id)` ON DELETE RESTRICT

---

### 3.18 `online_orders`
Orders placed by customers through the online portal.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `order_number` | `VARCHAR(30)` | NOT NULL, UNIQUE | — | e.g. `ORD-2026-0001` |
| `customer_id` | `INT UNSIGNED` | FK → `customers.id`, NOT NULL | — | |
| `promotion_id` | `INT UNSIGNED` | FK → `promotions.id`, NULL | NULL | Applied promotion/coupon |
| `status` | `ENUM(...)` | NOT NULL | `'PENDING_PAYMENT'` | See values below |
| `subtotal` | `DECIMAL(12,2)` | NOT NULL | — | Before discounts |
| `discount_amount` | `DECIMAL(10,2)` | NOT NULL | `0.00` | |
| `total_amount` | `DECIMAL(12,2)` | NOT NULL | — | Final payable amount |
| `delivery_address` | `TEXT` | NOT NULL | — | Snapshot of address at order time |
| `requires_prescription` | `TINYINT(1)` | NOT NULL | `0` | 1 = has prescription items |
| `notes` | `VARCHAR(500)` | NULL | NULL | Customer notes |
| `placed_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

**`status` values:**
`PENDING_PAYMENT`, `PAYMENT_FAILED`, `AWAITING_PRESCRIPTION`, `CONFIRMED`, `PROCESSING`, `READY_FOR_DELIVERY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REFUNDED`

**Foreign Keys:**
- `customer_id` → `customers(id)` ON DELETE RESTRICT
- `promotion_id` → `promotions(id)` ON DELETE SET NULL

---

### 3.19 `online_order_items`
Product lines within an online order. Prices are captured at time of order.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `online_order_id` | `INT UNSIGNED` | FK → `online_orders.id`, NOT NULL | — | |
| `product_id` | `INT UNSIGNED` | FK → `products.id`, NOT NULL | — | |
| `quantity` | `INT UNSIGNED` | NOT NULL | — | |
| `unit_price` | `DECIMAL(10,2)` | NOT NULL | — | Price snapshot at order time |
| `discount_amount` | `DECIMAL(10,2)` | NOT NULL | `0.00` | |
| `total_price` | `DECIMAL(12,2)` | NOT NULL | — | |

**Constraints:**
- `CHECK (quantity > 0)`
- `CHECK (unit_price >= 0)`

**Foreign Keys:**
- `online_order_id` → `online_orders(id)` ON DELETE RESTRICT
- `product_id` → `products(id)` ON DELETE RESTRICT

---

### 3.20 `prescriptions`
Customer-uploaded prescriptions. One prescription per online order.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `online_order_id` | `INT UNSIGNED` | FK → `online_orders.id`, NOT NULL, UNIQUE | — | One prescription per order |
| `customer_id` | `INT UNSIGNED` | FK → `customers.id`, NOT NULL | — | For access control |
| `file_path` | `VARCHAR(500)` | NOT NULL | — | Server-side file path |
| `original_filename` | `VARCHAR(255)` | NOT NULL | — | |
| `status` | `ENUM('PENDING','APPROVED','REJECTED')` | NOT NULL | `'PENDING'` | |
| `uploaded_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `reviewed_by` | `INT UNSIGNED` | FK → `users.id`, NULL | NULL | Staff reviewer |
| `reviewed_at` | `DATETIME` | NULL | NULL | |
| `review_notes` | `VARCHAR(500)` | NULL | NULL | Approval/rejection reason |

**Foreign Keys:**
- `online_order_id` → `online_orders(id)` ON DELETE RESTRICT
- `customer_id` → `customers(id)` ON DELETE RESTRICT
- `reviewed_by` → `users(id)` ON DELETE SET NULL

---

### 3.21 `payments`
Payment records for online orders.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `online_order_id` | `INT UNSIGNED` | FK → `online_orders.id`, NOT NULL, UNIQUE | — | One payment record per order |
| `payment_method` | `ENUM('ONLINE_GATEWAY','CASH_ON_DELIVERY')` | NOT NULL | — | |
| `amount` | `DECIMAL(12,2)` | NOT NULL | — | |
| `status` | `ENUM('PENDING','COMPLETED','FAILED','REFUNDED')` | NOT NULL | `'PENDING'` | |
| `transaction_reference` | `VARCHAR(150)` | NULL | NULL | Gateway transaction ID |
| `payment_gateway` | `VARCHAR(80)` | NULL | NULL | e.g. `Stripe`, `PayHere` |
| `failure_reason` | `VARCHAR(255)` | NULL | NULL | Populated on failure |
| `attempted_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `completed_at` | `DATETIME` | NULL | NULL | |

**Foreign Keys:**
- `online_order_id` → `online_orders(id)` ON DELETE RESTRICT

---

### 3.22 `promotions`
Discount campaigns and coupon codes.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `name` | `VARCHAR(150)` | NOT NULL | — | Campaign name |
| `description` | `TEXT` | NULL | NULL | |
| `coupon_code` | `VARCHAR(50)` | UNIQUE, NULL | NULL | NULL = auto-apply; not NULL = must enter code |
| `discount_type` | `ENUM('PERCENTAGE','FIXED_AMOUNT')` | NOT NULL | — | |
| `discount_value` | `DECIMAL(10,2)` | NOT NULL | — | % or flat amount |
| `min_order_amount` | `DECIMAL(10,2)` | NULL | NULL | Minimum order value to qualify |
| `max_discount_cap` | `DECIMAL(10,2)` | NULL | NULL | Max discount allowed (for % types) |
| `max_total_uses` | `INT UNSIGNED` | NULL | NULL | NULL = unlimited |
| `max_uses_per_customer` | `INT UNSIGNED` | NULL | `1` | NULL = unlimited |
| `applies_to_all_products` | `TINYINT(1)` | NOT NULL | `1` | 0 = specific products only (see `promotion_products`) |
| `is_active` | `TINYINT(1)` | NOT NULL | `1` | |
| `valid_from` | `DATETIME` | NOT NULL | — | |
| `valid_until` | `DATETIME` | NOT NULL | — | |
| `created_by` | `INT UNSIGNED` | FK → `users.id`, NOT NULL | — | |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Constraints:**
- `CHECK (discount_value > 0)`
- `CHECK (valid_until > valid_from)`

**Foreign Keys:**
- `created_by` → `users(id)` ON DELETE RESTRICT

---

### 3.23 `promotion_products`
Links promotions to specific products when `applies_to_all_products = 0`.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `promotion_id` | `INT UNSIGNED` | FK → `promotions.id`, NOT NULL | — | |
| `product_id` | `INT UNSIGNED` | FK → `products.id`, NOT NULL | — | |

**Primary Key:** `(promotion_id, product_id)` — composite

**Foreign Keys:**
- `promotion_id` → `promotions(id)` ON DELETE CASCADE
- `product_id` → `products(id)` ON DELETE CASCADE

---

### 3.24 `promotion_usage`
Tracks each time a promotion is used — prevents exceeding limits.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `promotion_id` | `INT UNSIGNED` | FK → `promotions.id`, NOT NULL | — | |
| `customer_id` | `INT UNSIGNED` | FK → `customers.id`, NULL | NULL | NULL = walk-in/anonymous in-store |
| `online_order_id` | `INT UNSIGNED` | FK → `online_orders.id`, NULL | NULL | |
| `sale_id` | `INT UNSIGNED` | FK → `sales.id`, NULL | NULL | |
| `discount_applied` | `DECIMAL(10,2)` | NOT NULL | — | Actual discount given |
| `used_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `promotion_id` → `promotions(id)` ON DELETE RESTRICT
- `customer_id` → `customers(id)` ON DELETE SET NULL
- `online_order_id` → `online_orders(id)` ON DELETE SET NULL
- `sale_id` → `sales(id)` ON DELETE SET NULL

---

### 3.25 `deliveries`
Delivery record created for each confirmed online order.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `INT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `online_order_id` | `INT UNSIGNED` | FK → `online_orders.id`, NOT NULL, UNIQUE | — | One delivery per order |
| `delivery_personnel_id` | `INT UNSIGNED` | FK → `users.id`, NULL | NULL | Assigned delivery officer |
| `delivery_address` | `TEXT` | NOT NULL | — | Snapshot from order |
| `status` | `ENUM('PENDING','OUT_FOR_DELIVERY','DELIVERED','FAILED')` | NOT NULL | `'PENDING'` | |
| `scheduled_date` | `DATE` | NULL | NULL | Planned delivery date |
| `delivered_at` | `DATETIME` | NULL | NULL | Actual delivery timestamp |
| `proof_of_delivery` | `VARCHAR(500)` | NULL | NULL | File path to photo/signature |
| `failure_reason` | `VARCHAR(255)` | NULL | NULL | Reason if status = FAILED |
| `delay_notes` | `VARCHAR(500)` | NULL | NULL | Notes on any delay |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `updated_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `online_order_id` → `online_orders(id)` ON DELETE RESTRICT
- `delivery_personnel_id` → `users(id)` ON DELETE SET NULL

---

### 3.26 `delivery_status_history`
Immutable audit log of every delivery status change.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `delivery_id` | `INT UNSIGNED` | FK → `deliveries.id`, NOT NULL | — | |
| `status` | `ENUM('PENDING','OUT_FOR_DELIVERY','DELIVERED','FAILED')` | NOT NULL | — | |
| `changed_by` | `INT UNSIGNED` | FK → `users.id`, NULL | NULL | |
| `changed_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |
| `notes` | `VARCHAR(500)` | NULL | NULL | |

**Foreign Keys:**
- `delivery_id` → `deliveries(id)` ON DELETE CASCADE
- `changed_by` → `users(id)` ON DELETE SET NULL

---

### 3.27 `activity_logs`
System-wide audit trail for significant actions.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `user_id` | `INT UNSIGNED` | FK → `users.id`, NULL | NULL | NULL = system action |
| `action` | `VARCHAR(100)` | NOT NULL | — | e.g. `PRESCRIPTION_APPROVED`, `STOCK_ADJUSTED` |
| `entity_type` | `VARCHAR(60)` | NOT NULL | — | e.g. `prescription`, `delivery`, `product` |
| `entity_id` | `INT UNSIGNED` | NULL | NULL | ID of the affected record |
| `details` | `JSON` | NULL | NULL | Additional context |
| `ip_address` | `VARCHAR(45)` | NULL | NULL | Supports IPv6 |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE SET NULL

---

### 3.28 `notifications`
In-application notifications for staff and customers.

| Column | Data Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `BIGINT UNSIGNED` | PK, AUTO_INCREMENT | — | |
| `user_id` | `INT UNSIGNED` | FK → `users.id`, NOT NULL | — | Recipient |
| `title` | `VARCHAR(150)` | NOT NULL | — | |
| `message` | `TEXT` | NOT NULL | — | |
| `type` | `VARCHAR(60)` | NOT NULL | — | e.g. `LOW_STOCK`, `NEW_ORDER`, `PRESCRIPTION_UPLOAD` |
| `is_read` | `TINYINT(1)` | NOT NULL | `0` | |
| `related_entity_type` | `VARCHAR(60)` | NULL | NULL | e.g. `online_order`, `delivery` |
| `related_entity_id` | `INT UNSIGNED` | NULL | NULL | |
| `created_at` | `DATETIME` | NOT NULL | `CURRENT_TIMESTAMP` | |

**Foreign Keys:**
- `user_id` → `users(id)` ON DELETE CASCADE

---

## 4. Relationship / Cardinality Summary

| Relationship | Cardinality |
|---|---|
| `roles` → `users` | One-to-Many |
| `users` → `customers` | One-to-One |
| `customers` → `customer_addresses` | One-to-Many |
| `customers` → `shopping_carts` | One-to-One (one active cart) |
| `shopping_carts` → `cart_items` | One-to-Many |
| `cart_items` → `products` | Many-to-One |
| `customers` → `online_orders` | One-to-Many |
| `online_orders` → `online_order_items` | One-to-Many |
| `online_order_items` → `products` | Many-to-One |
| `online_orders` → `prescriptions` | One-to-One |
| `online_orders` → `payments` | One-to-One |
| `online_orders` → `deliveries` | One-to-One |
| `deliveries` → `delivery_status_history` | One-to-Many |
| `categories` → `products` | One-to-Many |
| `manufacturers` → `products` | One-to-Many |
| `products` → `product_batches` | One-to-Many |
| `product_batches` → `stock_movements` | One-to-Many |
| `suppliers` → `purchase_orders` | One-to-Many |
| `purchase_orders` → `purchase_order_items` | One-to-Many |
| `purchase_order_items` → `products` | Many-to-One |
| `users` → `sales` (as staff) | One-to-Many |
| `customers` → `sales` (optional) | One-to-Many |
| `sales` → `sale_items` | One-to-Many |
| `sale_items` → `products` | Many-to-One |
| `sale_items` → `product_batches` | Many-to-One |
| `sales` → `sale_payments` | One-to-One |
| `promotions` → `promotion_products` | One-to-Many |
| `promotion_products` → `products` | Many-to-One |
| `promotions` → `promotion_usage` | One-to-Many |
| `users` → `activity_logs` | One-to-Many |
| `users` → `notifications` | One-to-Many |

---

## 5. Online Purchase Flow — Database Walkthrough

The following describes exactly which tables are read or written at each step of a complete online customer purchase.

```
Step 1 — Registration / Login
  WRITE: users (role_id = CUSTOMER)
  WRITE: customers (user_id, first_name, last_name, ...)
  WRITE: customer_addresses

Step 2 — Browse Products
  READ:  products (is_active = 1, requires_prescription)
  READ:  categories, manufacturers
  READ:  product_batches → SUM(quantity) for stock availability

Step 3 — Add to Cart
  WRITE: shopping_carts (created if not exists for customer)
  WRITE: cart_items (INSERT or UPDATE quantity if product already in cart)

Step 4 — Review Cart & Apply Coupon
  READ:  cart_items → products → selling_price
  READ:  promotions (coupon_code match, is_active, valid_from/until, min_order_amount)
  READ:  promotion_products (if applies_to_all_products = 0)
  READ:  promotion_usage (check per-customer usage count)

Step 5 — Place Order
  WRITE: online_orders (status = PENDING_PAYMENT, snapshot of delivery_address, totals)
  WRITE: online_order_items (product_id, quantity, unit_price snapshot)
  WRITE: promotion_usage (if coupon applied)
  DELETE/CLEAR: cart_items (cart is emptied after order is placed)
  NOTE:  Stock is NOT deducted here — deducted only after payment confirmed

Step 6a — Online Payment
  WRITE: payments (status = PENDING, payment_method = ONLINE_GATEWAY)
  [Gateway callback success]
  UPDATE: payments (status = COMPLETED, transaction_reference, completed_at)
  UPDATE: online_orders (status = CONFIRMED if no prescription, or AWAITING_PRESCRIPTION)
  WRITE: activity_logs (action = PAYMENT_COMPLETED)

Step 6b — Payment Failure
  UPDATE: payments (status = FAILED, failure_reason)
  UPDATE: online_orders (status = PAYMENT_FAILED)
  WRITE: notifications (user_id = customer, type = PAYMENT_FAILED)

Step 6c — Cash on Delivery
  WRITE: payments (status = PENDING, payment_method = CASH_ON_DELIVERY)
  UPDATE: online_orders (status = CONFIRMED or AWAITING_PRESCRIPTION)

Step 7 — Prescription Upload (if required)
  WRITE: prescriptions (online_order_id, file_path, status = PENDING)
  UPDATE: online_orders (status = AWAITING_PRESCRIPTION)
  WRITE: notifications (to INVENTORY_MANAGER / ADMIN, type = PRESCRIPTION_UPLOAD)

Step 8 — Prescription Review
  UPDATE: prescriptions (status = APPROVED or REJECTED, reviewed_by, reviewed_at)
  WRITE: activity_logs (action = PRESCRIPTION_APPROVED / REJECTED)
  UPDATE: online_orders (status = CONFIRMED if approved, CANCELLED if rejected)
  WRITE: notifications (to customer, result of review)

Step 9 — Stock Deduction (on confirmation)
  UPDATE: product_batches (quantity -= ordered amount, FIFO by expiry_date)
  WRITE: stock_movements (movement_type = ONLINE_SALE_OUT, reference_type = ONLINE_ORDER)

Step 10 — Delivery Creation
  WRITE: deliveries (online_order_id, status = PENDING, delivery_address snapshot)
  WRITE: delivery_status_history (status = PENDING)
  UPDATE: online_orders (status = READY_FOR_DELIVERY)
  WRITE: notifications (to assigned delivery officer)

Step 11 — Delivery Status Updates
  UPDATE: deliveries (status = OUT_FOR_DELIVERY / DELIVERED / FAILED)
  WRITE: delivery_status_history (each status change appended)
  UPDATE: online_orders (status mirrors delivery status)
  [If DELIVERED + CoD] UPDATE: payments (status = COMPLETED, completed_at)
  [If FAILED] WRITE: notifications (to customer, to admin)

Step 12 — Activity Logging (throughout all steps)
  WRITE: activity_logs for all significant events
```

---

## 6. Design Notes & Decisions

| Decision | Rationale |
|---|---|
| `users` + `customers` are separate tables | Keeps login/auth data clean; customer profile fields don't pollute the users table |
| Prices are **snapshotted** into order/sale items | Prevents historical records from changing if product price is updated later |
| `delivery_address` is stored as text in `online_orders` and `deliveries` | Address snapshot at order time; decoupled from the customer's current addresses |
| Stock deducted **after payment**, not on cart add | Avoids phantom stock reservations from abandoned carts |
| `product_batches` holds stock quantity | Enables FIFO stock deduction and expiry tracking per batch |
| `shopping_carts` is UNIQUE per customer | Enforces one active cart; cleared on order placement |
| `promotions.applies_to_all_products` flag | Avoids inserting rows into `promotion_products` for every product when a promotion is site-wide |
| `delivery_status_history` is append-only | Immutable audit trail; never updated, only inserted |
| `activity_logs.details` is JSON | Flexible schema for varying event metadata without extra columns |
| GPS tracking **not included** | Out of scope per requirements |
| Email/SMS **not included** | `notifications` table is in-app only |
