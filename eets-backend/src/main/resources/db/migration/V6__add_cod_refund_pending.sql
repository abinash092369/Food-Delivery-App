-- Migration: add cod_refund_pending to orders table
ALTER TABLE orders ADD COLUMN cod_refund_pending BOOLEAN DEFAULT FALSE;
