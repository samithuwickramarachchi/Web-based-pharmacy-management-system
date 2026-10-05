-- =============================================================================
-- Migration: v5_support_message_reply.sql
-- Phase 5: Staff Reply to Customer Support Messages
-- =============================================================================
-- Adds three nullable columns to support_messages so that an Admin,
-- Customer Manager, or Sales Officer can send a single reply to each
-- customer inquiry.  The reply is optional; NULL means "not yet replied".
-- =============================================================================

ALTER TABLE support_messages
    ADD COLUMN reply_text      TEXT         NULL     COMMENT 'Staff reply text; NULL = no reply yet',
    ADD COLUMN reply_at        DATETIME     NULL     COMMENT 'Timestamp when the reply was written',
    ADD COLUMN replied_by_name VARCHAR(150) NULL     COMMENT 'Display name of the staff member who replied';

-- =============================================================================
-- End of v5_support_message_reply.sql
-- =============================================================================
