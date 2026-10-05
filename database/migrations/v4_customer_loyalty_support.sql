-- =============================================================================
-- Migration: v4_customer_loyalty_support.sql
-- Phase 4: Customer Management (Loyalty System, Support Messages)
-- =============================================================================

-- 1. Add loyalty points and membership tier to customers table
ALTER TABLE customers
    ADD COLUMN loyalty_points  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Loyalty points accrued from purchases',
    ADD COLUMN membership_tier VARCHAR(20)  NOT NULL DEFAULT 'Standard' COMMENT 'Standard, Silver (100+), Gold (500+)';

-- 2. Add loyalty points awarded tracking flag to online_orders table
ALTER TABLE online_orders
    ADD COLUMN loyalty_points_awarded TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 if loyalty points have been awarded for this order';

-- 3. Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
    id              INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    customer_id     INT UNSIGNED    NOT NULL,
    subject         VARCHAR(200)    NOT NULL,
    message         TEXT            NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_support_messages PRIMARY KEY (id),
    CONSTRAINT fk_support_messages_customer FOREIGN KEY (customer_id) REFERENCES customers (id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_support_messages_customer_id (customer_id),
    INDEX idx_support_messages_created_at  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Customer support messages and inquiries';
