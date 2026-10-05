-- =============================================================================
-- Web-Based Pharmacy Management System
-- MySQL 8.0+ Schema
-- =============================================================================
-- Source:  database/DATABASE_DESIGN.md (Stage 3 approved design)
-- Created: Stage 4
--
-- IMPORTANT:
--   - No sample data, no credentials, no API keys in this file.
--   - Passwords are stored as bcrypt hashes only (in application layer).
--   - All monetary values use DECIMAL to avoid floating-point errors.
--   - CHECK constraints require MySQL 8.0.16+.
--   - Run this script on a freshly created, empty database.
--
-- Usage:
--   CREATE DATABASE pharmacy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE pharmacy_db;
--   SOURCE schema.sql;
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- SECTION 1: USER & ROLE MANAGEMENT
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: roles
-- Defines the access roles available in the system.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)     NOT NULL,
    description VARCHAR(255)    NULL     DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_roles PRIMARY KEY (id),
    CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='System roles: ADMIN, SALES_OFFICER, INVENTORY_MANAGER, etc.';

-- Pre-populate roles (no passwords or sensitive data)
INSERT INTO roles (name, description) VALUES
    ('ADMIN',              'Full system access and user management'),
    ('SALES_OFFICER',      'In-store sales, billing, and online order management'),
    ('INVENTORY_MANAGER',  'Product catalogue, stock, batches, and suppliers'),
    ('SUPPLIER_OFFICER',   'Purchase orders and supplier management'),
    ('PROMOTION_MANAGER',  'Discount campaigns and coupon management'),
    ('DELIVERY_OFFICER',   'Delivery assignment and status updates'),
    ('CUSTOMER_MANAGER',   'Customer account and profile management'),
    ('CUSTOMER',           'Customer-facing online portal access');

-- -----------------------------------------------------------------------------
-- Table: users
-- All system accounts — staff and customers share this table.
-- Customers additionally have a linked record in the `customers` table.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    role_id         INT UNSIGNED    NOT NULL,
    username        VARCHAR(50)     NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL  COMMENT 'Bcrypt hash — never store plaintext',
    is_active       TINYINT(1)      NOT NULL  DEFAULT 1,
    last_login_at   DATETIME        NULL      DEFAULT NULL,
    created_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_users          PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT fk_users_role     FOREIGN KEY (role_id) REFERENCES roles (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_users_role_id  (role_id),
    INDEX idx_users_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='All user accounts — staff and customer logins';

-- =============================================================================
-- SECTION 2: CUSTOMER MANAGEMENT
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: customers
-- Extended profile for customer-role users. One-to-one with users.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED    NOT NULL,
    first_name      VARCHAR(80)     NOT NULL,
    last_name       VARCHAR(80)     NOT NULL,
    phone           VARCHAR(20)     NULL      DEFAULT NULL,
    date_of_birth   DATE            NULL      DEFAULT NULL,
    membership_id   VARCHAR(30)     NULL      DEFAULT NULL COMMENT 'Auto-generated membership number',
    loyalty_points  INT UNSIGNED    NOT NULL  DEFAULT 0 COMMENT 'Loyalty points accrued from purchases',
    membership_tier VARCHAR(20)     NOT NULL  DEFAULT 'Standard' COMMENT 'Standard, Silver (100+), Gold (500+)',
    created_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_customers           PRIMARY KEY (id),
    CONSTRAINT uq_customers_user_id   UNIQUE (user_id),
    CONSTRAINT uq_customers_membership UNIQUE (membership_id),
    CONSTRAINT fk_customers_user      FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_customers_last_name (last_name),
    INDEX idx_customers_phone     (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Customer profile data — one-to-one extension of users';

-- -----------------------------------------------------------------------------
-- Table: customer_addresses
-- Saved delivery addresses per customer. A customer may have many addresses.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_addresses (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    customer_id     INT UNSIGNED    NOT NULL,
    label           VARCHAR(50)     NULL      DEFAULT NULL  COMMENT 'e.g. Home, Office',
    address_line1   VARCHAR(255)    NOT NULL,
    address_line2   VARCHAR(255)    NULL      DEFAULT NULL,
    city            VARCHAR(100)    NOT NULL,
    postal_code     VARCHAR(20)     NULL      DEFAULT NULL,
    is_default      TINYINT(1)      NOT NULL  DEFAULT 0,
    created_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_customer_addresses     PRIMARY KEY (id),
    CONSTRAINT fk_cust_addr_customer     FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_cust_addr_customer_id (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Saved delivery addresses for customers';

-- -----------------------------------------------------------------------------
-- Table: support_messages
-- Inquiries and support messages sent by customers.
-- Staff can reply via reply_text / reply_at / replied_by_name columns.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_messages (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    customer_id     INT UNSIGNED    NOT NULL,
    subject         VARCHAR(200)    NOT NULL,
    message         TEXT            NOT NULL,
    created_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    -- Staff reply fields (NULL = no reply yet)
    reply_text      TEXT            NULL      COMMENT 'Staff reply text; NULL = not yet replied',
    reply_at        DATETIME        NULL      COMMENT 'Timestamp when the reply was written',
    replied_by_name VARCHAR(150)    NULL      COMMENT 'Display name of the staff member who replied',

    CONSTRAINT pk_support_messages PRIMARY KEY (id),
    CONSTRAINT fk_support_messages_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_support_messages_customer_id (customer_id),
    INDEX idx_support_messages_created_at  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Customer support messages and inquiries with staff replies';


-- =============================================================================
-- SECTION 3: PRODUCT / INVENTORY
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: categories
-- Product/medicine categories. Supports one level of parent-child hierarchy.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    parent_id   INT UNSIGNED    NULL      DEFAULT NULL COMMENT 'NULL = top-level category',
    name        VARCHAR(100)    NOT NULL,
    description VARCHAR(255)    NULL      DEFAULT NULL,
    created_at  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_categories      PRIMARY KEY (id),
    CONSTRAINT uq_categories_name UNIQUE (name),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_categories_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Product and medicine categories with optional parent hierarchy';

-- -----------------------------------------------------------------------------
-- Table: manufacturers
-- Medicine and product manufacturers.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS manufacturers (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name            VARCHAR(150)    NOT NULL,
    country         VARCHAR(100)    NULL      DEFAULT NULL,
    contact_email   VARCHAR(150)    NULL      DEFAULT NULL,
    contact_phone   VARCHAR(30)     NULL      DEFAULT NULL,
    created_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_manufacturers      PRIMARY KEY (id),
    CONSTRAINT uq_manufacturers_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Medicine and product manufacturers';

-- -----------------------------------------------------------------------------
-- Table: products
-- Master product catalogue. Stock is tracked per-batch in product_batches.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    category_id             INT UNSIGNED    NULL      DEFAULT NULL,
    manufacturer_id         INT UNSIGNED    NULL      DEFAULT NULL,
    name                    VARCHAR(200)    NOT NULL,
    sku                     VARCHAR(60)     NOT NULL  COMMENT 'Stock-keeping unit code',
    description             TEXT            NULL      DEFAULT NULL,
    dosage_info             VARCHAR(200)    NULL      DEFAULT NULL  COMMENT 'e.g. 500mg, 10ml/5ml',
    unit                    VARCHAR(30)     NOT NULL  COMMENT 'e.g. tablet, bottle, strip',
    selling_price           DECIMAL(10,2)   NOT NULL,
    requires_prescription   TINYINT(1)      NOT NULL  DEFAULT 0,
    min_reorder_level       INT UNSIGNED    NOT NULL  DEFAULT 10,
    is_active               TINYINT(1)      NOT NULL  DEFAULT 1,
    created_at              DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_products           PRIMARY KEY (id),
    CONSTRAINT uq_products_sku       UNIQUE (sku),
    CONSTRAINT fk_products_category  FOREIGN KEY (category_id) REFERENCES categories (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_products_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturers (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_products_price    CHECK (selling_price >= 0),
    CONSTRAINT chk_products_reorder  CHECK (min_reorder_level >= 0),

    INDEX idx_products_category_id     (category_id),
    INDEX idx_products_manufacturer_id (manufacturer_id),
    INDEX idx_products_is_active       (is_active),
    INDEX idx_products_requires_rx     (requires_prescription),
    FULLTEXT INDEX ftidx_products_name_desc (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Master product/medicine catalogue';

-- -----------------------------------------------------------------------------
-- Table: product_batches
-- Individual stock batches per product — tracks expiry dates and quantities.
-- Stock on hand = SUM(quantity) for active, non-expired batches.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_batches (
    id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    product_id       INT UNSIGNED   NOT NULL,
    batch_number     VARCHAR(80)    NOT NULL  COMMENT 'Manufacturer batch/lot number',
    quantity         INT            NOT NULL  COMMENT 'Current units remaining in this batch',
    cost_price       DECIMAL(10,2)  NOT NULL  COMMENT 'Purchase cost per unit',
    manufacture_date DATE           NULL      DEFAULT NULL,
    expiry_date      DATE           NOT NULL,
    is_active        TINYINT(1)     NOT NULL  DEFAULT 1  COMMENT '0 = expired or written off',
    created_at       DATETIME       NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_product_batches          PRIMARY KEY (id),
    CONSTRAINT uq_product_batch_number     UNIQUE (product_id, batch_number),
    CONSTRAINT fk_batches_product          FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_batches_quantity        CHECK (quantity >= 0),
    CONSTRAINT chk_batches_cost_price      CHECK (cost_price >= 0),

    INDEX idx_batches_product_id  (product_id),
    INDEX idx_batches_expiry_date (expiry_date),
    INDEX idx_batches_is_active   (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Per-product stock batches with expiry tracking';

-- -----------------------------------------------------------------------------
-- Table: stock_movements
-- Immutable audit trail of every stock quantity change.
-- Positive quantity_change = stock in; negative = stock out.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id      INT UNSIGNED    NOT NULL,
    batch_id        INT UNSIGNED    NULL      DEFAULT NULL,
    movement_type   ENUM(
                        'PURCHASE_IN',
                        'SALE_OUT',
                        'ONLINE_SALE_OUT',
                        'ADJUSTMENT_IN',
                        'ADJUSTMENT_OUT',
                        'RETURN_IN',
                        'EXPIRY_WRITEOFF',
                        'TRANSFER'
                    )               NOT NULL,
    quantity_change INT             NOT NULL  COMMENT 'Positive = in, negative = out',
    reference_type  VARCHAR(50)     NULL      DEFAULT NULL  COMMENT 'e.g. SALE, ONLINE_ORDER, PURCHASE_ORDER',
    reference_id    INT UNSIGNED    NULL      DEFAULT NULL  COMMENT 'ID of the related source record',
    notes           VARCHAR(255)    NULL      DEFAULT NULL,
    performed_by    INT UNSIGNED    NULL      DEFAULT NULL  COMMENT 'NULL = automated system action',
    performed_at    DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_stock_movements      PRIMARY KEY (id),
    CONSTRAINT fk_stock_mv_product     FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_stock_mv_batch       FOREIGN KEY (batch_id) REFERENCES product_batches (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_stock_mv_user        FOREIGN KEY (performed_by) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_stock_mv_product_id    (product_id),
    INDEX idx_stock_mv_batch_id      (batch_id),
    INDEX idx_stock_mv_type          (movement_type),
    INDEX idx_stock_mv_reference     (reference_type, reference_id),
    INDEX idx_stock_mv_performed_at  (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable stock movement audit trail';

-- =============================================================================
-- SECTION 4: SUPPLIERS / PROCUREMENT
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: suppliers
-- Registered suppliers who provide stock to the pharmacy.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name            VARCHAR(150)    NOT NULL,
    contact_person  VARCHAR(100)    NULL      DEFAULT NULL,
    phone           VARCHAR(30)     NULL      DEFAULT NULL,
    email           VARCHAR(150)    NULL      DEFAULT NULL,
    address         TEXT            NULL      DEFAULT NULL,
    is_active       TINYINT(1)      NOT NULL  DEFAULT 1,
    created_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_suppliers      PRIMARY KEY (id),
    CONSTRAINT uq_suppliers_name UNIQUE (name),

    INDEX idx_suppliers_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Suppliers who provide stock to the pharmacy';

-- -----------------------------------------------------------------------------
-- Table: purchase_orders
-- Orders placed by pharmacy staff to restock from suppliers.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_orders (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    po_number               VARCHAR(30)     NOT NULL  COMMENT 'e.g. PO-2026-0001',
    supplier_id             INT UNSIGNED    NOT NULL,
    ordered_by              INT UNSIGNED    NOT NULL  COMMENT 'Staff user who created this PO',
    status                  ENUM(
                                'DRAFT',
                                'SUBMITTED',
                                'CONFIRMED',
                                'PARTIALLY_RECEIVED',
                                'RECEIVED',
                                'CANCELLED'
                            )               NOT NULL  DEFAULT 'DRAFT',
    order_date              DATE            NOT NULL,
    expected_delivery_date  DATE            NULL      DEFAULT NULL,
    received_date           DATE            NULL      DEFAULT NULL,
    total_amount            DECIMAL(12,2)   NOT NULL  DEFAULT 0.00,
    notes                   TEXT            NULL      DEFAULT NULL,
    created_at              DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_purchase_orders         PRIMARY KEY (id),
    CONSTRAINT uq_purchase_orders_po_num  UNIQUE (po_number),
    CONSTRAINT fk_po_supplier             FOREIGN KEY (supplier_id) REFERENCES suppliers (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_po_ordered_by           FOREIGN KEY (ordered_by) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_po_supplier_id (supplier_id),
    INDEX idx_po_status      (status),
    INDEX idx_po_order_date  (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Purchase orders placed to suppliers for restocking';

-- -----------------------------------------------------------------------------
-- Table: purchase_order_items
-- Line items within a purchase order.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    purchase_order_id   INT UNSIGNED    NOT NULL,
    product_id          INT UNSIGNED    NOT NULL,
    quantity_ordered    INT UNSIGNED    NOT NULL,
    quantity_received   INT UNSIGNED    NOT NULL  DEFAULT 0,
    unit_cost           DECIMAL(10,2)   NOT NULL  COMMENT 'Agreed cost per unit',
    total_cost          DECIMAL(12,2)   NOT NULL  COMMENT 'quantity_ordered × unit_cost',

    CONSTRAINT pk_po_items              PRIMARY KEY (id),
    CONSTRAINT uq_po_items_product      UNIQUE (purchase_order_id, product_id),
    CONSTRAINT fk_po_items_po           FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_po_items_product      FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_po_items_qty_ordered   CHECK (quantity_ordered > 0),
    CONSTRAINT chk_po_items_qty_received  CHECK (quantity_received >= 0),
    CONSTRAINT chk_po_items_unit_cost     CHECK (unit_cost >= 0),

    INDEX idx_po_items_po_id      (purchase_order_id),
    INDEX idx_po_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Line items within each purchase order';

-- =============================================================================
-- SECTION 5: PROMOTIONS
-- (Created before sales and online_orders — both reference promotions)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: promotions
-- Discount campaigns and coupon codes.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promotions (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name                    VARCHAR(150)    NOT NULL,
    description             TEXT            NULL      DEFAULT NULL,
    coupon_code             VARCHAR(50)     NULL      DEFAULT NULL  COMMENT 'NULL = auto-apply promotion',
    discount_type           ENUM(
                                'PERCENTAGE',
                                'FIXED_AMOUNT'
                            )               NOT NULL,
    discount_value          DECIMAL(10,2)   NOT NULL,
    min_order_amount        DECIMAL(10,2)   NULL      DEFAULT NULL  COMMENT 'Minimum order value to qualify',
    max_discount_cap        DECIMAL(10,2)   NULL      DEFAULT NULL  COMMENT 'Max discount allowed for percentage types',
    max_total_uses          INT UNSIGNED    NULL      DEFAULT NULL  COMMENT 'NULL = unlimited',
    max_uses_per_customer   INT UNSIGNED    NULL      DEFAULT 1     COMMENT 'NULL = unlimited per customer',
    applies_to_all_products TINYINT(1)      NOT NULL  DEFAULT 1     COMMENT '0 = specific products via promotion_products',
    is_active               TINYINT(1)      NOT NULL  DEFAULT 1,
    valid_from              DATETIME        NOT NULL,
    valid_until             DATETIME        NOT NULL,
    created_by              INT UNSIGNED    NOT NULL,
    created_at              DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_promotions             PRIMARY KEY (id),
    CONSTRAINT uq_promotions_coupon_code UNIQUE (coupon_code),
    CONSTRAINT fk_promotions_created_by  FOREIGN KEY (created_by) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_promotions_value      CHECK (discount_value > 0),
    CONSTRAINT chk_promotions_dates      CHECK (valid_until > valid_from),

    INDEX idx_promotions_coupon_code (coupon_code),
    INDEX idx_promotions_is_active   (is_active),
    INDEX idx_promotions_valid_from  (valid_from),
    INDEX idx_promotions_valid_until (valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Discount campaigns and coupon codes';

-- -----------------------------------------------------------------------------
-- Table: promotion_products
-- Links promotions to specific products when applies_to_all_products = 0.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promotion_products (
    promotion_id    INT UNSIGNED    NOT NULL,
    product_id      INT UNSIGNED    NOT NULL,

    CONSTRAINT pk_promotion_products     PRIMARY KEY (promotion_id, product_id),
    CONSTRAINT fk_promo_prod_promotion   FOREIGN KEY (promotion_id) REFERENCES promotions (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_promo_prod_product     FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_promo_prod_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Products eligible for a specific promotion';

-- =============================================================================
-- SECTION 6: IN-STORE SALES AND BILLING
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: sales
-- In-store sales transaction header.
-- customer_id is nullable — NULL represents a walk-in customer.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    sale_number     VARCHAR(30)     NOT NULL  COMMENT 'e.g. INV-2026-0001',
    customer_id     INT UNSIGNED    NULL      DEFAULT NULL COMMENT 'NULL = anonymous walk-in',
    staff_id        INT UNSIGNED    NOT NULL,
    promotion_id    INT UNSIGNED    NULL      DEFAULT NULL,
    sale_date       DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    subtotal        DECIMAL(12,2)   NOT NULL,
    discount_amount DECIMAL(10,2)   NOT NULL  DEFAULT 0.00,
    tax_amount      DECIMAL(10,2)   NOT NULL  DEFAULT 0.00,
    total_amount    DECIMAL(12,2)   NOT NULL,
    notes           VARCHAR(255)    NULL      DEFAULT NULL,
    created_at      DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_sales              PRIMARY KEY (id),
    CONSTRAINT uq_sales_number       UNIQUE (sale_number),
    CONSTRAINT fk_sales_customer     FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_sales_staff        FOREIGN KEY (staff_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_sales_promotion    FOREIGN KEY (promotion_id) REFERENCES promotions (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_sales_subtotal        CHECK (subtotal >= 0),
    CONSTRAINT chk_sales_discount        CHECK (discount_amount >= 0),
    CONSTRAINT chk_sales_total           CHECK (total_amount >= 0),

    INDEX idx_sales_customer_id  (customer_id),
    INDEX idx_sales_staff_id     (staff_id),
    INDEX idx_sales_sale_date    (sale_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='In-store sales transaction headers';

-- -----------------------------------------------------------------------------
-- Table: sale_items
-- Individual product lines within a sale. Prices are snapshotted at sale time.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    sale_id         INT UNSIGNED    NOT NULL,
    product_id      INT UNSIGNED    NOT NULL,
    batch_id        INT UNSIGNED    NOT NULL  COMMENT 'Which batch the stock was taken from',
    quantity        INT UNSIGNED    NOT NULL,
    unit_price      DECIMAL(10,2)   NOT NULL  COMMENT 'Price at time of sale — not linked to current product price',
    discount_amount DECIMAL(10,2)   NOT NULL  DEFAULT 0.00,
    total_price     DECIMAL(12,2)   NOT NULL  COMMENT '(unit_price × quantity) - discount_amount',

    CONSTRAINT pk_sale_items        PRIMARY KEY (id),
    CONSTRAINT fk_sale_items_sale   FOREIGN KEY (sale_id) REFERENCES sales (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_sale_items_batch  FOREIGN KEY (batch_id) REFERENCES product_batches (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_sale_items_qty        CHECK (quantity > 0),
    CONSTRAINT chk_sale_items_unit_price CHECK (unit_price >= 0),

    INDEX idx_sale_items_sale_id    (sale_id),
    INDEX idx_sale_items_product_id (product_id),
    INDEX idx_sale_items_batch_id   (batch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Line items within in-store sales — prices snapshotted at time of sale';

-- -----------------------------------------------------------------------------
-- Table: sale_payments
-- One payment record per in-store sale.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_payments (
    id               INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    sale_id          INT UNSIGNED   NOT NULL,
    payment_method   ENUM(
                         'CASH',
                         'CARD',
                         'ONLINE_TRANSFER'
                     )              NOT NULL,
    amount_paid      DECIMAL(12,2)  NOT NULL,
    change_given     DECIMAL(10,2)  NOT NULL  DEFAULT 0.00 COMMENT 'Change returned for cash payments',
    reference_number VARCHAR(100)   NULL      DEFAULT NULL COMMENT 'Card terminal or transfer reference',
    paid_at          DATETIME       NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_sale_payments       PRIMARY KEY (id),
    CONSTRAINT uq_sale_payments_sale  UNIQUE (sale_id),
    CONSTRAINT fk_sale_payments_sale  FOREIGN KEY (sale_id) REFERENCES sales (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_sale_payments_amount CHECK (amount_paid >= 0),

    INDEX idx_sale_payments_sale_id (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Payment records for in-store sales — one per sale';

-- =============================================================================
-- SECTION 7: ONLINE PURCHASING
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: shopping_carts
-- One active cart per customer at any time.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shopping_carts (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    customer_id INT UNSIGNED    NOT NULL,
    created_at  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_shopping_carts          PRIMARY KEY (id),
    CONSTRAINT uq_shopping_carts_customer UNIQUE (customer_id),
    CONSTRAINT fk_shopping_carts_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Active shopping carts — one per customer';

-- -----------------------------------------------------------------------------
-- Table: cart_items
-- Products in a customer cart. Quantity is updated in-place rather than
-- inserting duplicates (enforced by unique constraint on cart_id + product_id).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
    id          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    cart_id     INT UNSIGNED    NOT NULL,
    product_id  INT UNSIGNED    NOT NULL,
    quantity    INT UNSIGNED    NOT NULL,
    added_at    DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_cart_items            PRIMARY KEY (id),
    CONSTRAINT uq_cart_items_product    UNIQUE (cart_id, product_id),
    CONSTRAINT fk_cart_items_cart       FOREIGN KEY (cart_id) REFERENCES shopping_carts (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product    FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_cart_items_quantity  CHECK (quantity > 0),

    INDEX idx_cart_items_cart_id    (cart_id),
    INDEX idx_cart_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Products in active shopping carts';

-- -----------------------------------------------------------------------------
-- Table: online_orders
-- Orders placed by customers through the online portal.
-- delivery_address stores a text snapshot of the address at order time.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS online_orders (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    order_number            VARCHAR(30)     NOT NULL  COMMENT 'e.g. ORD-2026-0001',
    customer_id             INT UNSIGNED    NOT NULL,
    promotion_id            INT UNSIGNED    NULL      DEFAULT NULL,
    status                  ENUM(
                                'PENDING_PAYMENT',
                                'PAYMENT_FAILED',
                                'AWAITING_PRESCRIPTION',
                                'CONFIRMED',
                                'PROCESSING',
                                'READY_FOR_DELIVERY',
                                'OUT_FOR_DELIVERY',
                                'DELIVERED',
                                'CANCELLED',
                                'REFUNDED'
                            )               NOT NULL  DEFAULT 'PENDING_PAYMENT',
    subtotal                DECIMAL(12,2)   NOT NULL,
    discount_amount         DECIMAL(10,2)   NOT NULL  DEFAULT 0.00,
    total_amount            DECIMAL(12,2)   NOT NULL,
    delivery_address        TEXT            NOT NULL  COMMENT 'Address snapshot at order time',
    fulfillment_type        VARCHAR(20)     NOT NULL  DEFAULT 'DELIVERY' COMMENT 'Fulfillment type: DELIVERY or STORE_PICKUP',
    requires_prescription   TINYINT(1)      NOT NULL  DEFAULT 0,
    notes                   VARCHAR(500)    NULL      DEFAULT NULL,
    loyalty_points_awarded  TINYINT(1)      NOT NULL  DEFAULT 0 COMMENT '1 if loyalty points have been awarded for this order',
    placed_at               DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_online_orders           PRIMARY KEY (id),
    CONSTRAINT uq_online_orders_number    UNIQUE (order_number),
    CONSTRAINT fk_online_orders_customer  FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_online_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_online_orders_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_online_orders_discount CHECK (discount_amount >= 0),
    CONSTRAINT chk_online_orders_total    CHECK (total_amount >= 0),

    INDEX idx_online_orders_customer_id (customer_id),
    INDEX idx_online_orders_status      (status),
    INDEX idx_online_orders_placed_at   (placed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Online orders placed by customers';

-- -----------------------------------------------------------------------------
-- Table: online_order_items
-- Product lines within an online order. Prices snapshotted at order time.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS online_order_items (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    online_order_id INT UNSIGNED    NOT NULL,
    product_id      INT UNSIGNED    NOT NULL,
    quantity        INT UNSIGNED    NOT NULL,
    unit_price      DECIMAL(10,2)   NOT NULL  COMMENT 'Price at time of order',
    discount_amount DECIMAL(10,2)   NOT NULL  DEFAULT 0.00,
    total_price     DECIMAL(12,2)   NOT NULL,

    CONSTRAINT pk_online_order_items         PRIMARY KEY (id),
    CONSTRAINT fk_ooi_online_order           FOREIGN KEY (online_order_id) REFERENCES online_orders (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ooi_product                FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_ooi_quantity              CHECK (quantity > 0),
    CONSTRAINT chk_ooi_unit_price            CHECK (unit_price >= 0),

    INDEX idx_ooi_online_order_id (online_order_id),
    INDEX idx_ooi_product_id      (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Line items for online orders — prices snapshotted at order time';

-- =============================================================================
-- SECTION 8: PRESCRIPTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: prescriptions
-- Customer-uploaded prescriptions linked to online orders.
-- One prescription per online order.
-- Access is restricted — file_path must not be publicly accessible.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    online_order_id     INT UNSIGNED    NOT NULL,
    customer_id         INT UNSIGNED    NOT NULL  COMMENT 'For access control validation',
    file_path           VARCHAR(500)    NOT NULL  COMMENT 'Server-side storage path — not a public URL',
    original_filename   VARCHAR(255)    NOT NULL  COMMENT 'Original name of the uploaded file',
    status              ENUM(
                            'PENDING',
                            'APPROVED',
                            'REJECTED'
                        )               NOT NULL  DEFAULT 'PENDING',
    uploaded_at         DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    reviewed_by         INT UNSIGNED    NULL      DEFAULT NULL COMMENT 'Staff user who reviewed this prescription',
    reviewed_at         DATETIME        NULL      DEFAULT NULL,
    review_notes        VARCHAR(500)    NULL      DEFAULT NULL,

    CONSTRAINT pk_prescriptions             PRIMARY KEY (id),
    CONSTRAINT uq_prescriptions_order       UNIQUE (online_order_id),
    CONSTRAINT fk_prescriptions_order       FOREIGN KEY (online_order_id) REFERENCES online_orders (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_prescriptions_customer    FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_prescriptions_reviewer    FOREIGN KEY (reviewed_by) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_prescriptions_customer_id (customer_id),
    INDEX idx_prescriptions_status      (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Customer-uploaded prescriptions — one per online order';

-- =============================================================================
-- SECTION 9: ONLINE PAYMENTS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: payments
-- Payment records for online orders. One payment record per order.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    online_order_id         INT UNSIGNED    NOT NULL,
    payment_method          ENUM(
                                'ONLINE_GATEWAY',
                                'CASH_ON_DELIVERY'
                            )               NOT NULL,
    amount                  DECIMAL(12,2)   NOT NULL,
    status                  ENUM(
                                'PENDING',
                                'COMPLETED',
                                'FAILED',
                                'REFUNDED'
                            )               NOT NULL  DEFAULT 'PENDING',
    transaction_reference   VARCHAR(150)    NULL      DEFAULT NULL COMMENT 'Gateway transaction ID',
    payment_gateway         VARCHAR(80)     NULL      DEFAULT NULL COMMENT 'e.g. Stripe, PayHere',
    failure_reason          VARCHAR(255)    NULL      DEFAULT NULL,
    attempted_at            DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    completed_at            DATETIME        NULL      DEFAULT NULL,

    CONSTRAINT pk_payments              PRIMARY KEY (id),
    CONSTRAINT uq_payments_order        UNIQUE (online_order_id),
    CONSTRAINT fk_payments_order        FOREIGN KEY (online_order_id) REFERENCES online_orders (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_payments_amount      CHECK (amount >= 0),

    INDEX idx_payments_status           (status),
    INDEX idx_payments_payment_method   (payment_method),
    INDEX idx_payments_attempted_at     (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Payment records for online orders — one per order';

-- =============================================================================
-- SECTION 10: PROMOTION USAGE
-- (Created after sales and online_orders — references both)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: promotion_usage
-- Tracks each time a promotion is used to enforce per-customer and total limits.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promotion_usage (
    id                  INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    promotion_id        INT UNSIGNED    NOT NULL,
    customer_id         INT UNSIGNED    NULL      DEFAULT NULL COMMENT 'NULL = anonymous walk-in',
    online_order_id     INT UNSIGNED    NULL      DEFAULT NULL,
    sale_id             INT UNSIGNED    NULL      DEFAULT NULL,
    discount_applied    DECIMAL(10,2)   NOT NULL  COMMENT 'Actual discount amount given',
    used_at             DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_promotion_usage             PRIMARY KEY (id),
    CONSTRAINT fk_promo_usage_promotion       FOREIGN KEY (promotion_id) REFERENCES promotions (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_promo_usage_customer        FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_promo_usage_online_order    FOREIGN KEY (online_order_id) REFERENCES online_orders (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_promo_usage_sale            FOREIGN KEY (sale_id) REFERENCES sales (id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_promo_usage_promotion_id    (promotion_id),
    INDEX idx_promo_usage_customer_id     (customer_id),
    INDEX idx_promo_usage_online_order_id (online_order_id),
    INDEX idx_promo_usage_sale_id         (sale_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks promotion usage to enforce per-customer and total limits';

-- =============================================================================
-- SECTION 11: DELIVERY
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: deliveries
-- Delivery record for each confirmed online order. One delivery per order.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
    id                      INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    online_order_id         INT UNSIGNED    NOT NULL,
    delivery_personnel_id   INT UNSIGNED    NULL      DEFAULT NULL COMMENT 'Assigned delivery officer user',
    delivery_address        TEXT            NOT NULL  COMMENT 'Address snapshot from online_orders',
    status                  ENUM(
                                'PENDING',
                                'OUT_FOR_DELIVERY',
                                'DELIVERED',
                                'FAILED'
                            )               NOT NULL  DEFAULT 'PENDING',
    scheduled_date          DATE            NULL      DEFAULT NULL,
    delivered_at            DATETIME        NULL      DEFAULT NULL,
    proof_of_delivery       VARCHAR(500)    NULL      DEFAULT NULL COMMENT 'File path to photo or signature',
    failure_reason          VARCHAR(255)    NULL      DEFAULT NULL,
    delay_notes             VARCHAR(500)    NULL      DEFAULT NULL,
    created_at              DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT pk_deliveries                PRIMARY KEY (id),
    CONSTRAINT uq_deliveries_order          UNIQUE (online_order_id),
    CONSTRAINT fk_deliveries_online_order   FOREIGN KEY (online_order_id) REFERENCES online_orders (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_deliveries_personnel      FOREIGN KEY (delivery_personnel_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_deliveries_personnel_id  (delivery_personnel_id),
    INDEX idx_deliveries_status        (status),
    INDEX idx_deliveries_scheduled_date (scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Delivery records for confirmed online orders — one per order';

-- -----------------------------------------------------------------------------
-- Table: delivery_status_history
-- Immutable append-only log of every delivery status transition.
-- Never updated — only INSERT new rows.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_status_history (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    delivery_id INT UNSIGNED    NOT NULL,
    status      ENUM(
                    'PENDING',
                    'OUT_FOR_DELIVERY',
                    'DELIVERED',
                    'FAILED'
                )               NOT NULL,
    changed_by  INT UNSIGNED    NULL      DEFAULT NULL,
    changed_at  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    notes       VARCHAR(500)    NULL      DEFAULT NULL,

    CONSTRAINT pk_delivery_status_history       PRIMARY KEY (id),
    CONSTRAINT fk_dsh_delivery                  FOREIGN KEY (delivery_id) REFERENCES deliveries (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_dsh_changed_by                FOREIGN KEY (changed_by) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_dsh_delivery_id (delivery_id),
    INDEX idx_dsh_changed_at  (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Immutable delivery status change history — append-only';

-- =============================================================================
-- SECTION 12: SYSTEM RECORDS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: activity_logs
-- System-wide audit trail for significant actions.
-- details column stores flexible JSON context (e.g. changed field values).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED    NULL      DEFAULT NULL COMMENT 'NULL = automated system action',
    action      VARCHAR(100)    NOT NULL  COMMENT 'e.g. PRESCRIPTION_APPROVED, STOCK_ADJUSTED',
    entity_type VARCHAR(60)     NOT NULL  COMMENT 'e.g. prescription, delivery, product',
    entity_id   INT UNSIGNED    NULL      DEFAULT NULL,
    details     JSON            NULL      DEFAULT NULL COMMENT 'Flexible additional context',
    ip_address  VARCHAR(45)     NULL      DEFAULT NULL COMMENT 'Supports IPv4 and IPv6',
    created_at  DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_activity_logs     PRIMARY KEY (id),
    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_activity_logs_user_id     (user_id),
    INDEX idx_activity_logs_action      (action),
    INDEX idx_activity_logs_entity      (entity_type, entity_id),
    INDEX idx_activity_logs_created_at  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='System-wide audit trail — immutable action log';

-- =============================================================================
-- SECTION 13: NOTIFICATIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: notifications
-- In-application notifications for staff and customers.
-- No email or SMS — in-app only.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED    NOT NULL  COMMENT 'Recipient user',
    title               VARCHAR(150)    NOT NULL,
    message             TEXT            NOT NULL,
    type                VARCHAR(60)     NOT NULL  COMMENT 'e.g. LOW_STOCK, NEW_ORDER, PRESCRIPTION_UPLOAD',
    is_read             TINYINT(1)      NOT NULL  DEFAULT 0,
    related_entity_type VARCHAR(60)     NULL      DEFAULT NULL COMMENT 'e.g. online_order, delivery',
    related_entity_id   INT UNSIGNED    NULL      DEFAULT NULL,
    created_at          DATETIME        NOT NULL  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_notifications         PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user    FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_notifications_user_id   (user_id),
    INDEX idx_notifications_is_read   (user_id, is_read),
    INDEX idx_notifications_type      (type),
    INDEX idx_notifications_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='In-application notifications — no email or SMS';

-- =============================================================================
-- Re-enable foreign key checks
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- End of schema.sql
-- 28 tables created across 13 sections.
-- =============================================================================
