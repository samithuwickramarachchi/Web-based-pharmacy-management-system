-- =============================================================================
-- Migration: v6_order_fulfillment_type.sql
-- Order Fulfillment: Delivery vs Store Pickup
-- =============================================================================
-- Adds fulfillment_type column to online_orders table.
-- Existing records default to 'DELIVERY' to preserve backward compatibility.
-- Allowed values: 'DELIVERY', 'STORE_PICKUP'.
-- Safe migration: preserves all existing data and does not drop tables.
-- =============================================================================

ALTER TABLE online_orders
    ADD COLUMN fulfillment_type VARCHAR(20) NOT NULL DEFAULT 'DELIVERY' COMMENT 'Fulfillment type: DELIVERY or STORE_PICKUP';

-- =============================================================================
-- End of v6_order_fulfillment_type.sql
-- =============================================================================
